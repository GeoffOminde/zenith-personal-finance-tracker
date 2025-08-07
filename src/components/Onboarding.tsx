
import React, { useState } from 'react';
import Button from './ui/Button';

// --- ICONS ---
const ZenithIcon = () => <svg className="w-16 h-16 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>;
const TransactionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const BudgetsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const InsightsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const RocketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;

const steps = [
  {
    icon: <ZenithIcon />,
    title: 'Welcome to Zenith!',
    description: "Your new personal finance command center. Let's take a quick tour to get you started on the path to financial clarity."
  },
  {
    icon: <TransactionsIcon />,
    title: 'Track Every Penny',
    description: 'The first step to financial clarity is knowing where your money goes. Use the "Transactions" page to log every income and expense.'
  },
  {
    icon: <BudgetsIcon />,
    title: 'Create Smart Budgets',
    description: 'Set spending limits for different categories on the "Budgets" page. Zenith will help you stick to them and visualize your progress.'
  },
  {
    icon: <InsightsIcon />,
    title: 'Unlock AI Power',
    description: 'Go to "Settings" and add your Gemini API key. This activates powerful features like the Smart Feed and an AI assistant to analyze your finances.'
  },
  {
    icon: <RocketIcon />,
    title: "You're All Set!",
    description: 'You have everything you need to take control of your finances. Let\'s get started!'
  }
];

interface OnboardingProps {
    onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const isLastStep = currentStep === steps.length - 1;
    const stepData = steps[currentStep];

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center">
                <div className="mb-6">{stepData.icon}</div>
                <h2 className="text-3xl font-bold text-white mb-3">{stepData.title}</h2>
                <p className="text-gray-300 mb-8">{stepData.description}</p>
                
                <div className="flex items-center justify-center space-x-2 mb-8">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                currentStep === index ? 'bg-blue-500 scale-125' : 'bg-gray-600'
                            }`}
                        />
                    ))}
                </div>

                <div className="w-full">
                    {isLastStep ? (
                        <Button onClick={onComplete} size="lg" className="w-full">Get Started</Button>
                    ) : (
                        <div className="flex items-center justify-between w-full gap-4">
                            <Button onClick={onComplete} variant="secondary" className="bg-transparent text-gray-400 hover:bg-gray-700">Skip</Button>
                            <div className="flex items-center gap-2">
                               {currentStep > 0 && <Button onClick={handlePrev} variant="secondary">Previous</Button>}
                               <Button onClick={handleNext}>Next</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;