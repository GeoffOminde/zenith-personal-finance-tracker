
import { useState, useCallback } from 'react';
import type { User } from '../types';

export type UseAuthReturn = ReturnType<typeof useAuth>;

const defaultUser: User = {
    id: 'user@zenith.app',
    email: 'user@zenith.app',
    plan: 'premium',
};

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(defaultUser);

    const login = useCallback(async (): Promise<boolean> => true, []);
    const signup = useCallback(async (): Promise<boolean> => true, []);
    const logout = useCallback(() => { /* No-op */ }, []);
    
    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
    }, []);

    return { user, loading: false, login, signup, logout, updateUser };
};
