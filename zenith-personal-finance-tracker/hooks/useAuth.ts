
import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';

export type UseAuthReturn = ReturnType<typeof useAuth>;

// Mock database in localStorage
const getUsers = (): Record<string, Omit<User, 'email' | 'id'>> => {
    const users = localStorage.getItem('zenith_users');
    return users ? JSON.parse(users) : {};
};

const saveUsers = (users: Record<string, Omit<User, 'email'|'id'>>) => {
    localStorage.setItem('zenith_users', JSON.stringify(users));
};

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const currentUserId = localStorage.getItem('zenith_currentUser');
            if (currentUserId) {
                const users = getUsers();
                const userData = users[currentUserId];
                if (userData) {
                    setUser({ ...userData, email: currentUserId, id: currentUserId });
                }
            }
        } catch (error) {
            console.error("Failed to load user from localStorage", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (email: string): Promise<boolean> => {
        const users = getUsers();
        if (users[email]) {
            // Mock login success - no password check for this simulation
            localStorage.setItem('zenith_currentUser', email);
            setUser({ ...users[email], email, id: email });
            return true;
        }
        return false;
    }, []);

    const signup = useCallback(async (email: string): Promise<boolean> => {
        const users = getUsers();
        if (users[email]) {
            return false; // User already exists
        }
        users[email] = { plan: 'free' };
        saveUsers(users);
        localStorage.setItem('zenith_currentUser', email);
        setUser({ plan: 'free', email, id: email });
        localStorage.setItem('zenith_onboarding_completed', 'true');
        return true;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('zenith_currentUser');
        setUser(null);
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        const users = getUsers();
        const { id, email, ...dataToSave } = updatedUser;
        users[email] = dataToSave;
        saveUsers(users);
        setUser(updatedUser);
    }, []);

    return { user, loading, login, signup, logout, updateUser };
};