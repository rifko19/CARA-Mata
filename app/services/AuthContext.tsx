// services/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';

interface AuthContextType {
    isAuthenticated: boolean;
    isGuest: boolean;
    setGuestMode: (isGuest: boolean) => void;
    }

    const AuthContext = createContext<AuthContextType | undefined>(undefined);

    export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
    };

    export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setIsAuthenticated(true);
            setIsGuest(false); // Reset guest mode when user logs in
        } else {
            setIsAuthenticated(false);
            // Don't reset guest mode on logout, keep it if it was set
        }
        });

        return unsubscribe;
    }, []);

    const setGuestMode = (guestMode: boolean) => {
        setIsGuest(guestMode);
    };

    const value = {
        isAuthenticated,
        isGuest,
        setGuestMode,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    };