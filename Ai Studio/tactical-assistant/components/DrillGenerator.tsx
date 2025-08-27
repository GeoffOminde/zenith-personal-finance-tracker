
import React, { useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { generateDrills } from '../services/geminiService';
import { Drill } from '../types';
import { SparklesIcon, WhistleIcon } from './common/icons';

const DrillGenerator: React.FC = () => {
  const [weakness, setWeakness] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!weakness.trim()) {
      setError('Please describe a team weakness first.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setDrills([]);

    try {
      const result = await generateDrills(weakness);
      setDrills(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while generating drills.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const exampleWeaknesses = [
    "Our team is slow to reset in defensive transition (basketball).",
    "We struggle to secure possession at the breakdown (rugby).",
    "Our free-throw shooting percentage is below average (basketball).",
    "We concede too many tries from rolling mauls (rugby)."
  ];

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-brand-text mb-4">Drill Generator</h2>
        <p className="text-brand-light mb-4">
          Describe a team weakness or an opponent's strength, and the AI will generate tailored training drills to address it.
        </p>
        <div className="space-y-4">
          <textarea
            value={weakness}
            onChange={(e) => setWeakness(e.target.value)}
            placeholder="e.g., Our rugby team's lineout success rate is poor..."
            className="w-full p-3 bg-brand-primary border-2 border-brand-accent rounded-md focus:outline-none focus:ring-2 focus:ring-brand-cyan text-brand-text"
            rows={4}
          />
          <div className="text-sm text-brand-light">
            <p className="font-semibold">Need ideas? Try one of these:</p>
            <ul className="flex flex-wrap gap-2 mt-2">
              {exampleWeaknesses.map(ex => (
                <li key={ex}>
                  <button onClick={() => setWeakness(ex)} className="text-xs bg-brand-accent px-2 py-1 rounded-full hover:bg-brand-light hover:text-brand-primary transition-colors">
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={handleGenerate} isLoading={isGenerating} disabled={isGenerating}>
            <SparklesIcon className="w-5 h-5" />
            {isGenerating ? 'Generating...' : 'Generate Drills'}
          </Button>
        </div>
      </Card>
      
      {error && (
        <Card className="bg-red-900 border border-red-500">
          <h3 className="font-bold text-red-300">Generation Failed</h3>
          <p className="text-red-300">{error}</p>
        </Card>
      )}

      {drills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drills.map((drill, index) => (
            <Card key={index} className="flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                 <WhistleIcon className="w-8 h-8 text-brand-cyan"/>
                 <h3 className="text-lg font-bold text-brand-cyan">{drill.name}</h3>
              </div>
              <p className="text-brand-light mb-4 flex-grow">{drill.description}</p>
              <div>
                <h4 className="font-semibold text-brand-text mb-2">Focus Areas:</h4>
                <div className="flex flex-wrap gap-2">
                  {drill.focus.map((area) => (
                    <span key={area} className="text-xs bg-brand-accent text-brand-text px-3 py-1 rounded-full">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DrillGenerator;