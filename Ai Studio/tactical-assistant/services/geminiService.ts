import { GoogleGenAI, Type } from "@google/genai";
import { Drill, SearchResult, GroundingSource, Feedback, FeedbackAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = "gemini-2.5-flash";

/**
 * Analyzes a summary of match footage to identify key tactical moments.
 * @param summary - A text summary of the match.
 * @returns A list of key tactical moments.
 */
export async function analyzeFootageSummary(summary: string): Promise<string[]> {
  try {
    const prompt = `
      You are a world-class rugby and basketball tactical analyst.
      Analyze the following match summary and identify 5-7 key tactical moments.
      For each moment, provide a concise one-sentence description.
      Focus on actionable insights a coach could use. Examples include line breaks, missed tackles, successful defensive sets, positional errors, or brilliant passes.
      Do not mention the score or goals unless they are a direct result of a key tactical play.
      Return the output as a JSON array of strings.

      MATCH SUMMARY:
      ---
      ${summary}
      ---
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                    description: "A single, concise description of a key tactical moment."
                }
            }
        }
    });

    const jsonText = response.text.trim();
    let result;

    try {
        result = JSON.parse(jsonText);
    } catch (parseError) {
        console.warn("AI returned malformed JSON for footage summary:", jsonText);
        throw new Error("AI response was not valid JSON.");
    }
    
    if (!Array.isArray(result) || !result.every(item => typeof item === 'string')) {
        console.warn("AI JSON format mismatch for footage summary. Expected array of strings, got:", result);
        throw new Error("AI response was not in the expected format (array of strings).");
    }

    return result;
  } catch (error) {
    console.error("Error analyzing footage summary:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze footage. AI Service Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred during footage analysis.");
  }
}

/**
 * Generates training drills based on a described team weakness.
 * @param weakness - A description of the team's weakness.
 * @returns An array of Drill objects.
 */
export async function generateDrills(weakness: string): Promise<Drill[]> {
  try {
    const prompt = `
      You are an expert coach with top-level credentials in both rugby and basketball.
      Based on the following team weakness, create exactly 3 distinct and creative training drills.
      For each drill, provide a name, a concise description of how to execute it, and a list of key focus areas (e.g., 'Communication', 'Positioning', 'Passing Accuracy').

      Team Weakness: "${weakness}"
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                description: "A list of training drills.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description: "A short, catchy name for the drill."
                        },
                        description: {
                            type: Type.STRING,
                            description: "A step-by-step description of the drill setup and execution."
                        },
                        focus: {
                            type: Type.ARRAY,
                            description: "A list of key skills or tactical areas this drill improves.",
                            items: {
                                type: Type.STRING
                            }
                        }
                    },
                    required: ["name", "description", "focus"]
                }
            }
        }
    });

    const jsonText = response.text.trim();
    let result;

    try {
        result = JSON.parse(jsonText);
    } catch(parseError) {
        console.warn("AI returned malformed JSON for drills:", jsonText);
        throw new Error("AI response was not valid JSON.");
    }
    
    if (!Array.isArray(result) || result.some(d => !d.name || !d.description || !d.focus)) {
        console.warn("AI JSON format mismatch for drills. Got:", result);
        throw new Error("AI response was not in the expected format (array of Drills).");
    }

    return result as Drill[];
  } catch (error) {
    console.error("Error generating drills:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate drills. AI Service Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating drills.");
  }
}

/**
 * Searches for tactical information using Google Search grounding.
 * @param query - The user's search query.
 * @returns A SearchResult object with the answer and sources.
 */
export async function searchTactics(query: string): Promise<SearchResult> {
  try {
    const prompt = `
      You are a world-class tactical analyst for rugby and basketball.
      Answer the following question based on real-world, up-to-date information from your search results.
      Provide a comprehensive and insightful answer.

      Question: "${query}"
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const answer = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingSource[] | undefined;
    const sources = groundingChunks?.filter(chunk => chunk.web && chunk.web.uri) ?? [];

    return {
      answer,
      sources,
    };

  } catch (error) {
    console.error("Error during tactical search:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to perform search. AI Service Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred during the tactical search.");
  }
}


/**
 * Analyzes a list of player feedback to generate a summary of themes.
 * @param feedbackList - An array of Feedback objects.
 * @returns A FeedbackAnalysis object.
 */
export async function analyzePlayerFeedback(feedbackList: Feedback[]): Promise<FeedbackAnalysis> {
    try {
        const allComments = feedbackList.map(fb => `- (Rating: ${fb.rating}/5) ${fb.comment}`).join("\n");
        const prompt = `
            You are an experienced coaching assistant, skilled at interpreting player feedback.
            Analyze the following list of anonymous feedback from a training session.
            Your task is to synthesize this information into a clear, actionable summary for the head coach.

            Follow these instructions:
            1.  Write a brief, one-paragraph overall summary of the feedback.
            2.  Identify 2-3 common POSITIVE themes. These are things players liked or found helpful.
            3.  Identify 2-3 common CONSTRUCTIVE themes. These are areas for improvement or things players struggled with.

            Feedback Data:
            ---
            ${allComments}
            ---
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: "A one-paragraph summary of the overall sentiment and key takeaways."
                        },
                        positiveThemes: {
                            type: Type.ARRAY,
                            description: "A list of common positive points from the feedback.",
                            items: { type: Type.STRING }
                        },
                        constructiveThemes: {
                            type: Type.ARRAY,
                            description: "A list of common constructive points or areas for improvement.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["summary", "positiveThemes", "constructiveThemes"]
                }
            }
        });

        const jsonText = response.text.trim();
        let result;
        
        try {
            result = JSON.parse(jsonText);
        } catch (parseError) {
            console.warn("AI returned malformed JSON for feedback analysis:", jsonText);
            throw new Error("AI response was not valid JSON.");
        }


        if (!result.summary || !result.positiveThemes || !result.constructiveThemes) {
            console.warn("AI JSON format mismatch for feedback analysis. Got:", result);
            throw new Error("AI response was not in the expected format (FeedbackAnalysis).");
        }

        return result as FeedbackAnalysis;

    } catch(error) {
        console.error("Error analyzing player feedback:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to analyze feedback. AI Service Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred during feedback analysis.");
    }
}