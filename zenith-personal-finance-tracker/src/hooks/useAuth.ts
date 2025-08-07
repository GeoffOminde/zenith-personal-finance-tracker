import { useState, useCallback } from 'react';
import type { User } from '../types';

export type UseAuthReturn = ReturnType<typeof useAuth>;

const defaultUser: User = {
    id: 'user@zenith.app',
    email: 'user@zenith.app',
    plan: 'premium',
};

export const useAuth = () => {
    // The user is now hardcoded, so we don't need to check localStorage.
    const [user, setUser] = useState<User | null>(defaultUser);

    // The loading state can be set to false as there's no async operation.
    const [loading, setLoading] = useState(false);

    // Mock functions are kept for API compatibility but are no-ops.
    const login = useCallback(async (): Promise<boolean> => true, []);
    const signup = useCallback(async (): Promise<boolean> => true, []);
    const logout = useCallback(() => { /* No-op, as there's no session to clear */ }, []);
    
    // This allows other parts of the app (like a future plan switcher) to work.
    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
    }, []);

    return { user, loading, login, signup, logout, updateUser };
};
