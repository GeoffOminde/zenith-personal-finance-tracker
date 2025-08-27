import React, { useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { Feedback, FeedbackAnalysis } from '../types';
import { analyzePlayerFeedback } from '../services/geminiService';
import { SparklesIcon, CheckCircleIcon, ExclamationCircleIcon } from './common/icons';

const initialFeedback: Feedback[] = [
  { id: 1, playerName: 'Player A', rating: 4, comment: 'The new attacking drills felt great. I think they will really help in the next match.', date: '2 days ago' },
  { id: 2, playerName: 'Player B', rating: 3, comment: 'Conditioning was really tough today. Could we have a lighter session before match days?', date: '1 day ago' },
  { id: 3, playerName: 'Anonymous', rating: 5, comment: 'Loved the tactical session on defending the pick and roll. Very clear and helpful.', date: '5 hours ago' },
  { id: 4, playerName: 'Player C', rating: 4, comment: 'The clarity on defensive positioning was a game-changer. I feel more confident.', date: '6 hours ago' },
  { id: 5, playerName: 'Player D', rating: 2, comment: "I'm finding it hard to keep up with the pace of the pre-season fitness regime. It feels a bit too intense.", date: '8 hours ago' },
];

const PlayerFeedback: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>(initialFeedback);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // State for AI analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FeedbackAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (rating === 0 || !comment.trim()) {
      setFormError("Please provide a rating and a comment.");
      return;
    }
    setIsSubmitting(true);
    const newFeedback: Feedback = {
      id: feedbackList.length + 1,
      playerName: 'Anonymous',
      rating,
      comment,
      date: 'Just now'
    };
    // Simulate API call
    setTimeout(() => {
      setFeedbackList([newFeedback, ...feedbackList]);
      setRating(0);
      setComment('');
      setIsSubmitting(false);
    }, 1000);
  };

  const handleAnalyzeFeedback = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
        const result = await analyzePlayerFeedback(feedbackList);
        setAnalysisResult(result);
    } catch(err) {
        setAnalysisError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <h2 className="text-xl font-bold text-brand-cyan mb-4">Submit Feedback</h2>
          <p className="text-brand-light mb-6 text-sm">Your feedback is anonymous and helps improve training for everyone.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-brand-text font-semibold mb-2">Session Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button type="button" key={star} onClick={() => { setRating(star); setFormError(null); }} className="text-3xl transition-transform duration-200 hover:scale-125">
                    <span className={rating >= star ? 'text-yellow-400' : 'text-brand-accent'}>★</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="comment" className="block text-brand-text font-semibold mb-2">Comments</label>
              <textarea
                id="comment"
                value={comment}
                onChange={e => { setComment(e.target.value); setFormError(null); }}
                rows={5}
                className="w-full p-3 bg-brand-primary border-2 border-brand-accent rounded-md focus:outline-none focus:ring-2 focus:ring-brand-cyan text-brand-text"
                placeholder="What went well? What could be better?"
              />
            </div>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              Submit Anonymously
            </Button>
             {formError && (
              <p className="text-red-400 text-sm mt-2">{formError}</p>
            )}
          </form>
        </Card>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <div className="flex items-center gap-3 mb-2">
              <SparklesIcon className="w-8 h-8 text-brand-cyan"/>
              <h2 className="text-xl font-bold text-brand-cyan">AI-Powered Feedback Analysis</h2>
          </div>
          <p className="text-brand-light mb-4 text-sm">Let AI summarize all feedback to find key themes and insights instantly.</p>
          
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center gap-4 p-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-cyan"></div>
              <p className="text-brand-light">AI is summarizing feedback...</p>
            </div>
          )}

          {analysisError && (
             <Card className="bg-red-900 border border-red-500">
                <h3 className="font-bold text-red-300">Analysis Failed</h3>
                <p className="text-red-300">{analysisError}</p>
            </Card>
          )}

          {analysisResult && (
            <div className="space-y-4">
                <div>
                    <h3 className="font-bold text-brand-text mb-2">Overall Summary</h3>
                    <p className="text-brand-light bg-brand-primary p-3 rounded-md">{analysisResult.summary}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-bold text-brand-text mb-2">Positive Themes</h3>
                        <ul className="space-y-2">
                            {analysisResult.positiveThemes.map((theme, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"/>
                                    <span className="text-brand-light">{theme}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-bold text-brand-text mb-2">Constructive Themes</h3>
                        <ul className="space-y-2">
                            {analysisResult.constructiveThemes.map((theme, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <ExclamationCircleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5"/>
                                    <span className="text-brand-light">{theme}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <Button onClick={handleAnalyzeFeedback} variant="secondary" className="mt-4">
                    Re-analyze Feedback
                </Button>
            </div>
          )}
          
          {!isAnalyzing && !analysisResult && (
             <Button onClick={handleAnalyzeFeedback} isLoading={isAnalyzing} disabled={isAnalyzing || feedbackList.length === 0}>
                <SparklesIcon className="w-5 h-5" />
                {feedbackList.length > 0 ? 'Analyze All Feedback' : 'No Feedback to Analyze'}
            </Button>
          )}

        </Card>
        <Card>
          <h2 className="text-xl font-bold text-brand-cyan mb-4">Recent Feedback</h2>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {feedbackList.map(fb => (
              <div key={fb.id} className="bg-brand-primary p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-text">{fb.playerName}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < fb.rating ? 'text-yellow-400' : 'text-brand-accent'}>★</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-brand-light">{fb.date}</span>
                </div>
                <p className="text-brand-light">{fb.comment}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlayerFeedback;