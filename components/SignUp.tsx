
import React, { useState } from 'react';
import type { UseAuthReturn } from '../hooks/useAuth';
import Button from './ui/Button';
import Card from './ui/Card';

interface SignUpProps {
    setAuthView: (view: 'login' | 'signup') => void;
    auth: UseAuthReturn;
}

const SignUp: React.FC<SignUpProps> = ({ setAuthView, auth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        setError('');
        setLoading(true);
        const success = await auth.signup(email);
        if (!success) {
            setError("An account with that email already exists.");
        }
        // On success, the App component will automatically re-render.
        setLoading(false);
    };

    return (
        <Card className="w-full">
            <h2 className="text-2xl font-bold text-center text-white mb-6">Create Your Account</h2>
            {error && <p className="bg-red-900/50 text-red-300 text-sm text-center p-2 rounded-md mb-4">{error}</p>}
            <form onSubmit={handleSignUp} className="space-y-4">
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
                        placeholder="6+ characters"
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="pt-2">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </Button>
                </div>
            </form>
            <p className="text-center text-sm text-gray-400 mt-6">
                Already have an account?{' '}
                <button onClick={() => setAuthView('login')} className="font-medium text-blue-400 hover:text-blue-300">
                    Log In
                </button>
            </p>
        </Card>
    );
};

export default SignUp;
