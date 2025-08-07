
import React from 'react';

const ZenithIcon = () => (
    <svg className="w-12 h-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
);

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="flex items-center mb-8">
            <ZenithIcon />
            <h1 className="text-4xl font-bold ml-4">Zenith</h1>
        </div>
        <div className="w-full max-w-sm">
            {children}
        </div>
    </div>
);

export default AuthLayout;
