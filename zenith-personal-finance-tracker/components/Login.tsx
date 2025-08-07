
import React, { useState } from 'react';
import type { UseAuthReturn } from '../hooks/useAuth';
import Button from './ui/Button';
import Card from './ui/Card';

interface LoginProps {
    setAuthView: (view: 'login' | 'signup') => void;
    auth: UseAuthReturn;
}

const Login: React.FC<LoginProps> = ({ setAuthView, auth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const success = await auth.login(email);
        if (!success) {
            setError("No account found with that email.");
        }
        // On success, the App component will automatically re-render.
        setLoading(false);
    };

    return (
        <Card className="w-full">
            <h2 className="text-2xl font-bold text-center text-white mb-6">Welcome Back</h2>
            {error && <p className="bg-red-900/50 text-red-300 text-sm text-center p-2 rounded-md mb-4">{error}</p>}
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="pt-2">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </Button>
                </div>
            </form>
            <p className="text-center text-sm text-gray-400 mt-6">
                Don't have an account?{' '}
                <button onClick={() => setAuthView('signup')} className="font-medium text-blue-400 hover:text-blue-300">
                    Sign Up
                </button>
            </p>
        </Card>
    );
};

export default Login;
