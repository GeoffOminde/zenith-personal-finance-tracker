
import React, { useState, useEffect, useRef } from 'react';
import type { UseFinanceReturn } from '../hooks/useFinance';
import { GoogleGenAI, Chat, Type } from '@google/genai';
import { FinancialReport } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import ProgressBar from './ui/ProgressBar';

interface FinancialInsightsProps {
  finance: UseFinanceReturn;
  apiKey: string | null;
}

interface Source {
    title: string;
    uri: string;
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    sources?: Source[];
}

type InsightView = 'chat' | 'report';

const LoadingDots = () => (
    <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
    </div>
);

const ApiKeyPrompt: React.FC = () => (
    <Card className="border-yellow-500 border text-yellow-300 bg-yellow-900/20 mb-4 flex-shrink-0">
        <p className="font-semibold">API Key Required</p>
        <p>Please go to the 'Settings' page to set your Gemini API key to use this feature.</p>
    </Card>
);

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;

const ChatView: React.FC<{ finance: UseFinanceReturn; apiKey: string | null }> = ({ finance, apiKey }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
    }, [chatHistory]);

    useEffect(() => {
        if (!apiKey) {
            setChat(null);
            setError("API Key not found. Please set your Gemini API key in Settings.");
            return;
        }
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const financialData = {
                transactions: finance.transactions.slice(0, 50),
                budgets: finance.budgets,
                summary: finance.summary,
                categories: finance.categories,
            };
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are 'Zenith AI', a friendly and insightful personal finance assistant. Your knowledge is strictly limited to the JSON data provided unless the user enables web search. The user's expense categories are custom, so use the provided 'categories' list to map 'categoryId' in transactions and budgets to a human-readable name. Analyze the data to answer user questions concisely. Do not mention you are an AI. Current Date: ${new Date().toLocaleDateString()}`
                },
                history: [{
                    role: 'user',
                    parts: [{ text: `Here is my financial data. Please analyze it for my questions: ${JSON.stringify(financialData)}` }]
                }, {
                    role: 'model',
                    parts: [{ text: "Understood. I've reviewed your data and am ready to help. For broader financial questions, please enable 'Search the web'." }]
                }]
            });
            setChat(newChat);
            if(chatHistory.length === 0) {
                setChatHistory([
                    { role: 'model', text: "Hello! I'm Zenith AI. How can I help you understand your finances today? For general questions, toggle on 'Search the web'." }
                ]);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Failed to initialize Zenith AI: ${message}`);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, finance.transactions, finance.budgets, finance.summary, finance.categories]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || isLoading) return;
        const messageToSend = userInput;
        setUserInput('');
        setIsLoading(true);
        setError(null);
        setChatHistory(prev => [...prev, { role: 'user', text: messageToSend }]);

        const config = isWebSearchEnabled ? { tools: [{ googleSearch: {} }] } : {};

        try {
            const result = await chat.sendMessageStream({ message: messageToSend, config });
            let currentText = '';
            const collectedSources: Source[] = [];
            
            setChatHistory(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of result) {
                currentText += chunk.text;
                
                const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (groundingChunks) {
                    const newSources: Source[] = groundingChunks
                      .map((c: any) => ({ title: c.web?.title, uri: c.web?.uri }))
                      .filter((s: any): s is Source => s.uri && s.title);
                    
                    newSources.forEach(ns => {
                        if (!collectedSources.some(s => s.uri === ns.uri)) {
                            collectedSources.push(ns);
                        }
                    });
                }
                
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    const lastMessage = newHistory[newHistory.length - 1];
                    if (lastMessage) {
                        lastMessage.text = currentText;
                        if (collectedSources.length > 0) {
                            lastMessage.sources = [...collectedSources];
                        }
                    }
                    return newHistory;
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Sorry, I encountered an error. ${errorMessage}`);
            setChatHistory(prev => prev.slice(0, -1)); // Remove the empty model message
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full">
             {!apiKey && <ApiKeyPrompt />}
             {error && !isLoading && <Card className="border-red-500 border text-red-300 bg-red-900/20 mb-4 flex-shrink-0">{error}</Card>}
            <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">AI</div>}
                        <div className={`max-w-lg p-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            {msg.text ? msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>) : <LoadingDots />}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-600">
                                    <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center tracking-wider">
                                      <SearchIcon />
                                      SOURCES
                                    </h4>
                                    <div className="space-y-2">
                                    {msg.sources.map((source, i) => (
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" key={i} className="block bg-gray-800/50 p-2 rounded-md hover:bg-gray-800 transition-colors">
                                            <p className="text-sm font-medium text-blue-400 truncate">{source.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{source.uri}</p>
                                        </a>
                                    ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && chatHistory[chatHistory.length - 1].role === 'user' && (
                    <div className="flex items-end gap-2"><div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">AI</div><div className="max-w-lg p-3 rounded-xl bg-gray-700 text-gray-200"><LoadingDots /></div></div>
                )}
            </div>
            <form onSubmit={handleSendMessage} className="mt-6 flex-shrink-0">
                 <div className="flex items-center gap-4 mb-3">
                    <label htmlFor="web-search-toggle" className={`flex items-center cursor-pointer ${(!apiKey || !chat) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="relative">
                            <input 
                                id="web-search-toggle" 
                                type="checkbox" 
                                className="sr-only" 
                                checked={isWebSearchEnabled} 
                                onChange={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                                disabled={!apiKey || !chat}
                             />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${isWebSearchEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isWebSearchEnabled ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <div className="ml-2 text-sm text-gray-300">Search the web</div>
                    </label>
                </div>
                <div className="flex items-center bg-gray-800 rounded-lg p-2">
                    <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={isLoading ? "Zenith AI is thinking..." : "Ask a question about your finances..."} className="w-full bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none px-2" disabled={isLoading || !chat || !!error || !apiKey} aria-label="Chat input" />
                    <Button type="submit" disabled={isLoading || !userInput.trim() || !chat || !!error || !apiKey}>{isLoading ? <LoadingDots /> : "Send"}</Button>
                </div>
            </form>
        </div>
    );
};

const ReportView: React.FC<{ finance: UseFinanceReturn; apiKey: string | null }> = ({ finance, apiKey }) => {
    const [report, setReport] = useState<FinancialReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const generateReport = async () => {
        if (!apiKey) {
            setError("API Key not found. Please set your Gemini API key in Settings.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setReport(null);

        try {
            const ai = new GoogleGenAI({ apiKey });
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const thisMonthTransactions = finance.transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= firstDay && tDate <= lastDay;
            });

            if (thisMonthTransactions.length === 0) {
              setError("No transactions recorded for this month to generate a report.");
              setIsLoading(false);
              return;
            }
            
            const financialData = {
                transactions: thisMonthTransactions,
                budgets: finance.budgets,
                goals: finance.goals,
                categories: finance.categories,
            };

            const reportSchema = {
                type: Type.OBJECT,
                properties: {
                    reportTitle: { type: Type.STRING },
                    overallSummary: { type: Type.STRING },
                    keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
                    spendingBreakdown: { type: Type.OBJECT, properties: {
                        topCategory: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, amount: { type: Type.NUMBER }, percentage: { type: Type.NUMBER }}},
                        unusualSpending: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, amount: { type: Type.NUMBER }, reason: { type: Type.STRING }}}}
                    }},
                    budgetPerformance: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, budgeted: { type: Type.NUMBER }, spent: { type: Type.NUMBER }, status: { type: Type.STRING }}}},
                    goalProgress: { type: Type.STRING },
                    actionableTips: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Generate a financial report for ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}. The user's expense categories are custom, so use the provided 'categories' list to map 'categoryId' to a human-readable name. Analyze this data: ${JSON.stringify(financialData)}`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: reportSchema
                }
            });

            const reportData: FinancialReport = JSON.parse(response.text);
            setReport(reportData);

        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Failed to generate report. Details: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading) {
        return <div className="text-center py-20"><LoadingDots /> <p className="mt-2 text-gray-400">Generating your financial report...</p></div>
    }

    if (error) {
       return <Card className="border-red-500 border text-red-300 bg-red-900/20 mb-4">{error}</Card>;
    }
    
    if (report) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">{report.reportTitle}</h2>
                    <Button variant="secondary" onClick={generateReport} disabled={!apiKey}>Regenerate</Button>
                </div>
                
                <Card><p className="text-gray-300 italic">{report.overallSummary}</p></Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-3 text-white">Key Insights</h3>
                        <ul className="space-y-2 list-disc list-inside text-gray-300">
                            {report.keyInsights.map((insight, i) => <li key={i}>{insight}</li>)}
                        </ul>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold mb-3 text-white">Actionable Tips</h3>
                         <ul className="space-y-2 list-disc list-inside text-green-300">
                            {report.actionableTips.map((tip, i) => <li key={i}>{tip}</li>)}
                        </ul>
                    </Card>
                </div>

                <Card>
                    <h3 className="text-lg font-semibold mb-3 text-white">Budget Performance</h3>
                    {report.budgetPerformance.length > 0 ? (
                        <div className="space-y-4">
                        {report.budgetPerformance.map((b, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="font-medium">{b.category}</span>
                                    <span className="text-gray-400">${b.spent.toFixed(2)} / ${b.budgeted.toFixed(2)}</span>
                                </div>
                                <ProgressBar value={b.spent} max={b.budgeted} />
                                <p className="text-xs text-right mt-1 text-gray-400">{b.status}</p>
                            </div>
                        ))}
                        </div>
                    ) : <p className="text-gray-500">No budgets set for this month.</p>}
                </Card>

                <Card><h3 className="text-lg font-semibold mb-2 text-white">Goal Progress</h3><p className="text-gray-300">{report.goalProgress}</p></Card>
            </div>
        )
    }

    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white">Monthly Financial Report</h2>
            <p className="text-gray-400 mt-2 mb-6">Get a personalized report on your spending, budgets, and goals for the current month, powered by AI.</p>
            <Button onClick={generateReport} size="lg" disabled={!apiKey || isLoading}>Generate This Month's Report</Button>
            {!apiKey && <p className="text-yellow-400 text-sm mt-4">Please set your API key in Settings to use this feature.</p>}
        </div>
    )
};

const FinancialInsights: React.FC<FinancialInsightsProps> = ({ finance, apiKey }) => {
    const [view, setView] = useState<InsightView>('chat');

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-80px)]">
            <div className="flex-shrink-0 mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">AI Financial Assistant</h1>
                 <div className="flex border-b border-gray-700">
                    <button onClick={() => setView('chat')} className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'chat' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>AI Chat</button>
                    <button onClick={() => setView('report')} className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'report' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>AI Report</button>
                 </div>
            </div>
            <div className="flex-grow overflow-y-auto">
                 {view === 'chat' ? <ChatView finance={finance} apiKey={apiKey} /> : <ReportView finance={finance} apiKey={apiKey} />}
            </div>
        </div>
    );
};

export default FinancialInsights;