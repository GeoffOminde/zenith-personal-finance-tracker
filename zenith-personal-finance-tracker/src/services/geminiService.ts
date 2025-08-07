import { GoogleGenAI, Type } from '@google/genai';
import { Category, Transaction, TransactionType, AIBudgetSuggestion, AIMonthlySummary, AIForecast, RecurringTransaction, Goal, ParsedReceipt, FinancialHealthSummary, AIFinancialHealthAnalysis } from '../types';

/**
 * Gets an AI-powered category suggestion for a transaction description.
 * @param description The description of the transaction.
 * @param categories The user's list of available categories.
 * @param apiKey The user's Gemini API key.
 * @returns The ID of the suggested category, or null if no suggestion could be made.
 */
export const getCategorySuggestion = async (
  description: string,
  categories: Category[],
  apiKey: string
): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const schema = {
      type: Type.OBJECT,
      properties: {
        categoryId: {
          type: Type.STRING,
          description: `The ID of the most relevant category. Must be one of ${categories.map(c => c.id).join(', ')}.`,
        },
      },
      required: ['categoryId'],
    };

    const prompt = `Based on the following transaction description, which of these categories is the best fit?
    
    Description: "${description}"
    
    Available Categories (with their IDs):
    ${categories.map(c => `- ${c.name} (id: ${c.id})`).join('\n')}
    
    Respond with the ID of the best matching category. If none seem to fit well, choose the most plausible one or the 'Other' category if available.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0, // We want deterministic results
      },
    });

    const result = JSON.parse(response.text);

    if (result.categoryId && categories.some(c => c.id === result.categoryId)) {
      return result.categoryId;
    }

    return null;
  } catch (error) {
    console.error("Error getting category suggestion:", error);
    return null;
  }
};

/**
 * Gets AI-powered budget suggestions based on spending history.
 * @param transactions The user's list of transactions.
 * @param categories The user's list of available categories.
 * @param apiKey The user's Gemini API key.
 * @returns A promise that resolves to an array of budget suggestions.
 */
export const getAIBudgetSuggestions = async (
  transactions: Transaction[],
  categories: Category[],
  apiKey: string
): Promise<AIBudgetSuggestion[]> => {
  const ai = new GoogleGenAI({ apiKey });

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentExpenses = transactions.filter(
    t => t.type === TransactionType.Expense && new Date(t.date) >= ninetyDaysAgo && t.categoryId
  );

  if (recentExpenses.length < 5) {
    throw new Error("Not enough recent expense data to generate a budget. Please add more transactions from the last 90 days.");
  }
  
  // Create a minimal representation to save tokens
  const expenseData = recentExpenses.map(t => ({
      a: t.amount,
      c: t.categoryId,
      d: t.date.split('T')[0]
  }));
  const categoryData = categories.map(c => ({ id: c.id, n: c.name }));

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        categoryId: {
          type: Type.STRING,
          description: `The ID of the category for the budget. Must be one of ${categories.map(c => c.id).join(', ')}.`,
        },
        suggestedAmount: {
          type: Type.NUMBER,
          description: "A sensible, rounded, suggested monthly budget amount for this category.",
        },
        reasoning: {
          type: Type.STRING,
          description: "A short (1-2 sentences) explanation for the suggestion, referencing average spending."
        }
      },
      required: ['categoryId', 'suggestedAmount', 'reasoning'],
    },
  };

  const prompt = `Act as a financial advisor. I will provide you with my expense history for the last 90 days and my list of expense categories.
  Analyze my spending patterns for each category and suggest a reasonable monthly budget for each one I've spent money in.
  Base your suggestions on my average monthly spending, but round to a sensible number (e.g., round $123 to $125 or $150, not $123). Provide a brief reasoning for each suggestion.
  Do not suggest budgets for categories with no spending.

  My Categories (id, name):
  ${JSON.stringify(categoryData)}

  My Recent Expenses (a: amount, c: categoryId, d: date):
  ${JSON.stringify(expenseData)}
  
  Please provide the budget suggestions in the specified JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.5,
      },
    });

    const result = JSON.parse(response.text);

    if (Array.isArray(result)) {
      // Validate that all categoryIds in the response are valid
      return result.filter(sug => categories.some(c => c.id === sug.categoryId));
    }
    
    return [];
  } catch (error) {
    console.error("Error getting AI budget suggestions:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the AI.");
  }
};


/**
 * Gets a concise AI-powered monthly briefing.
 * @param transactions The user's list of transactions.
 * @param categories The user's list of available categories.
 * @param apiKey The user's Gemini API key.
 * @returns A promise that resolves to a monthly summary object.
 */
export const getAIMonthlyBriefing = async (
  transactions: Transaction[],
  categories: Category[],
  apiKey: string
): Promise<AIMonthlySummary> => {
    const ai = new GoogleGenAI({ apiKey });

    const now = new Date();
    const dayOfMonth = now.getDate();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfComparablePeriodLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, dayOfMonth);

    const expensesThisMonth = transactions.filter(
        t => t.type === TransactionType.Expense && new Date(t.date) >= startOfThisMonth && new Date(t.date) <= now
    );
    const expensesLastMonthComparable = transactions.filter(
        t => t.type === TransactionType.Expense && new Date(t.date) >= startOfLastMonth && new Date(t.date) <= endOfComparablePeriodLastMonth
    );

    if (expensesThisMonth.length < 2) {
        throw new Error("Not enough data for the current month to generate a briefing.");
    }
    
    const spendingThisMonth = expensesThisMonth.reduce((sum, t) => sum + t.amount, 0);
    const spendingLastMonth = expensesLastMonthComparable.reduce((sum, t) => sum + t.amount, 0);

    const expenseData = expensesThisMonth.map(t => ({
        a: t.amount,
        c: t.categoryId,
        de: t.description.substring(0, 50) // Truncate to save tokens
    }));
    const categoryData = categories.map(c => ({ id: c.id, n: c.name }));

    const schema = {
        type: Type.OBJECT,
        properties: {
            summaryText: {
                type: Type.STRING,
                description: "A very brief, encouraging, 1-2 sentence summary of this month's financial activity so far."
            },
            spendingChangePercentage: {
                type: Type.NUMBER,
                description: `Percentage change in spending compared to last month. E.g., for 15% increase, return 15. For 10% decrease, return -10. Calculated as ((thisMonth - lastMonth) / lastMonth) * 100. Return 0 if last month spending is zero.`
            },
            topCategory: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the top spending category this month." },
                    amount: { type: Type.NUMBER, description: "The total amount spent in that category this month." }
                },
                nullable: true
            }
        },
        required: ['summaryText', 'spendingChangePercentage', 'topCategory'],
    };

    const prompt = `Analyze my financial data for this month (${startOfThisMonth.toLocaleString('default', { month: 'long' })}) up to today, ${now.toLocaleDateString()}.
    
    My Data:
    - Spending so far this month: $${spendingThisMonth.toFixed(2)}
    - Spending during the same period last month: $${spendingLastMonth.toFixed(2)}
    - My expense categories: ${JSON.stringify(categoryData)}
    - This month's expenses (a: amount, c: categoryId, de: description): ${JSON.stringify(expenseData)}

    Please provide a concise analysis in the specified JSON format.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.3,
            }
        });

        const result = JSON.parse(response.text);

        // Basic validation
        if (typeof result.summaryText !== 'string' || typeof result.spendingChangePercentage !== 'number') {
            throw new Error("Received malformed data from AI.");
        }
        
        return result as AIMonthlySummary;

    } catch (error) {
        console.error("Error getting AI monthly briefing:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while contacting the AI.");
    }
};

export const getAIForecast = async (
    apiKey: string,
    transactions: Transaction[],
    recurringTransactions: RecurringTransaction[],
    goals: Goal[],
    currentBalance: number,
    forecastPeriodMonths: number
): Promise<AIForecast> => {
    const ai = new GoogleGenAI({ apiKey });
    
    const financialContext = {
        last90DaysTransactions: transactions.slice(0, 100), // a sample of recent data
        recurringTransactions,
        goals,
        currentBalance,
        forecastPeriodMonths,
    };
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: {
                type: Type.STRING,
                description: "A 2-3 sentence narrative summary of the financial forecast. Mention the overall trend (positive, negative, stable) and key drivers."
            },
            potentialIssues: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        month: { type: Type.STRING, description: "The month where a potential issue is identified (e.g., 'July 2024')." },
                        reason: { type: Type.STRING, description: "A brief explanation of the issue, e.g., 'High recurring expenses may lead to a negative cash flow.'" }
                    },
                    required: ['month', 'reason']
                }
            },
            goalImpact: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        goalName: { type: Type.STRING, description: "The name of the user's goal." },
                        forecast: { type: Type.STRING, description: "A short sentence on whether the user is on track to meet this goal based on their forecast." }
                    },
                    required: ['goalName', 'forecast']
                }
            },
            recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of 2-3 actionable recommendations to improve the financial outlook."
            }
        },
        required: ['summary', 'potentialIssues', 'goalImpact', 'recommendations']
    };

    const prompt = `Act as a financial analyst. Based on the following financial data, generate a forecast for the next ${forecastPeriodMonths} months. Analyze spending habits, recurring transactions, and goals to provide a narrative summary, identify potential cash flow issues, comment on goal feasibility, and offer actionable recommendations. Today is ${new Date().toDateString()}.
    
    Financial Context:
    ${JSON.stringify(financialContext)}
    
    Provide your analysis in the specified JSON format.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.5,
            }
        });
        
        const result = JSON.parse(response.text);

        // Basic validation
        if (!result.summary || !Array.isArray(result.recommendations)) {
            throw new Error("Received malformed data from AI.");
        }
        
        return result as AIForecast;

    } catch (error) {
        console.error("Error getting AI forecast:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while contacting the AI.");
    }
};

/**
 * Parses a receipt image and extracts transaction details.
 * @param apiKey The user's Gemini API key.
 * @param base64ImageData The base64 encoded string of the receipt image.
 * @returns A promise that resolves to the parsed receipt data.
 */
export const parseReceipt = async (
    apiKey: string,
    base64ImageData: string
): Promise<ParsedReceipt> => {
    const ai = new GoogleGenAI({ apiKey });

    const schema = {
        type: Type.OBJECT,
        properties: {
            description: {
                type: Type.STRING,
                description: "The name of the store or vendor.",
            },
            amount: {
                type: Type.NUMBER,
                description: "The final total amount of the transaction.",
            },
            date: {
                type: Type.STRING,
                description: "The date of the transaction in YYYY-MM-DD format. If not found, return today's date.",
            }
        },
        required: ['description', 'amount', 'date'],
    };

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64ImageData,
        },
    };

    const textPart = {
        text: `Analyze this receipt image. Extract the vendor name, the final total amount, and the transaction date. Today is ${new Date().toISOString().split('T')[0]}. If the date is ambiguous or not present, use today's date. Format the date as YYYY-MM-DD. Provide the output in the specified JSON format.`
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });
        
        const result = JSON.parse(response.text);

        if (typeof result.description === 'string' && typeof result.amount === 'number' && typeof result.date === 'string') {
            return result as ParsedReceipt;
        } else {
            throw new Error("AI response did not match the expected format.");
        }

    } catch (error) {
        console.error("Error parsing receipt:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while analyzing the receipt.");
    }
};

/**
 * Generates an AI-powered analysis of the user's financial health.
 * @param apiKey The user's Gemini API key.
 * @param healthSummary The calculated financial health metrics.
 * @returns A promise resolving to the AI analysis.
 */
export const getFinancialHealthAnalysis = async (
    apiKey: string,
    healthSummary: FinancialHealthSummary
): Promise<AIFinancialHealthAnalysis> => {
    const ai = new GoogleGenAI({ apiKey });

    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: {
                type: Type.STRING,
                description: "A 2-3 sentence, encouraging summary of the user's overall financial health based on their score."
            },
            strengths: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    required: ['title', 'explanation']
                },
                description: "List 1-2 key financial strengths."
            },
            areasForImprovement: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                        suggestion: { type: Type.STRING, description: "A concrete, actionable suggestion." }
                    },
                    required: ['title', 'explanation', 'suggestion']
                },
                description: "List the top 1-2 areas that need improvement."
            }
        },
        required: ['summary', 'strengths', 'areasForImprovement']
    };

    const prompt = `Act as a supportive financial coach. Here is a summary of a user's financial health.
    - Overall Score: ${healthSummary.overallScore}/100
    - Savings Rate: ${healthSummary.metrics.savingsRate.value.toFixed(1)}%
    - Debt-to-Income Ratio: ${healthSummary.metrics.debtToIncomeRatio.value.toFixed(1)}%
    - Emergency Fund: ${healthSummary.metrics.emergencyFund.value.toFixed(1)} months
    
    Based on this data, provide an analysis in the specified JSON format. The tone should be positive and empowering, even when pointing out weaknesses. Frame 'areas for improvement' as opportunities.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.6,
            }
        });

        const result = JSON.parse(response.text);

        if (!result.summary || !Array.isArray(result.strengths)) {
            throw new Error("Received malformed data from AI.");
        }
        
        return result as AIFinancialHealthAnalysis;

    } catch (error) {
        console.error("Error getting financial health analysis:", error);
        if (error instanceof Error) throw new Error(`Gemini API Error: ${error.message}`);
        throw new Error("An unknown error occurred while contacting the AI.");
    }
};