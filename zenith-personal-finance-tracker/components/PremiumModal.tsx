
import React from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

const FeatureItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-center">
        <svg className="h-6 w-6 text-green-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-gray-300">{children}</span>
    </li>
);

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onUpgrade }) => {

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Zenith Premium">
            <div className="text-center">
                <p className="text-gray-400 mb-6">
                    Unlock powerful features to gain full control over your financial life.
                </p>
                <div className="bg-gray-700/50 p-6 rounded-lg mb-6">
                    <ul className="space-y-4 text-left">
                        <FeatureItem>Unlimited Budgets & Goals</FeatureItem>
                        <FeatureItem>Connect Banks & Platforms</FeatureItem>
                        <FeatureItem>Debt Payoff Planner</FeatureItem>
                        <FeatureItem>Advanced AI Reports & Insights</FeatureItem>
                        <FeatureItem>Data Export</FeatureItem>
                    </ul>
                </div>

                <Button onClick={onUpgrade} size="lg" className="w-full">
                    Upgrade Now for $9.99/mo
                </Button>
                 <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:text-gray-400 transition-colors">
                    Continue with Free Plan
                </button>
            </div>
        </Modal>
    );
};

export default PremiumModal;