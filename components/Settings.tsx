
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Card from './ui/Card';
import Button from './ui/Button';

interface SettingsProps {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  resetData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ apiKey, setApiKey, resetData }) => {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    setKeyInput(apiKey || '');
  }, [apiKey]);

  const handleSaveAndValidate = async () => {
    const trimmedKey = keyInput.trim();
    if (!trimmedKey) {
        setApiKey(null);
        setValidationStatus('idle');
        setValidationMessage('API Key removed.');
        return;
    }
    
    setIsValidating(true);
    setValidationStatus('idle');
    setValidationMessage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: trimmedKey });
      // A simple, low-cost call to validate the key
      await ai.models.generateContent({model: 'gemini-2.5-flash', contents: 'Hi'});
      setApiKey(trimmedKey);
      setValidationStatus('success');
      setValidationMessage('API Key is valid and has been saved successfully!');
    } catch (error) {
      setValidationStatus('error');
      setValidationMessage('Invalid API Key. Please check the key and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      <Card>
        <h2 className="text-xl font-semibold mb-2 text-white">Gemini API Key</h2>
        <p className="text-sm text-gray-400 mb-4">
          Your Gemini API key is required for all AI-powered features, including the Smart Feed and Financial Insights. The key is stored securely in your browser's local storage and is never sent to our servers.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 items-start">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => {
                setKeyInput(e.target.value);
                setValidationStatus('idle');
            }}
            placeholder="Enter your Gemini API Key"
            className="flex-grow w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <Button onClick={handleSaveAndValidate} disabled={isValidating} className="w-full sm:w-auto">
            {isValidating ? 'Validating...' : 'Save & Validate Key'}
          </Button>
        </div>
         {validationMessage && (
            <p className={`text-sm mt-3 ${
                validationStatus === 'success' ? 'text-green-400' : 
                validationStatus === 'error' ? 'text-red-400' : 'text-gray-400'
            }`}>
                {validationMessage}
            </p>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-2 text-white">Account Data</h2>
        <p className="text-sm text-gray-400 mb-4">
          This will permanently delete all your financial data (transactions, budgets, etc.) for your account. The application will be restored to a blank state for you. This action cannot be undone.
        </p>
        <Button variant="secondary" onClick={resetData} className="bg-red-800 hover:bg-red-700 focus:ring-red-600">
          Reset All My Data
        </Button>
      </Card>
    </div>
  );
};

export default Settings;