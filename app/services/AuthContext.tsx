import React, { createContext, useContext, useState, useEffect } from 'react';
// IMPOR signOut DITAMBAHKAN DI SINI
import { onAuthStateChanged, User, signOut } from 'firebase/auth'; 
import { auth } from './firebaseConfig'; 

// 1. PERBARUI INTERFACE: Tambahkan fungsi logout dan loading
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isGuest: boolean;
    setGuestMode: (isGuest: boolean) => void;
    logout: () => Promise<void>; 
    loading: boolean; // <-- PROPERTI BARU: Status Pemuatan
}

// Gunakan 'undefined' untuk nilai default di createContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true); // <-- Definisikan state loading

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                setIsAuthenticated(true);
                setIsGuest(false);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            // 2. Set LOADING ke false SETELAH status user final
            setLoading(false); 
        });

        return unsubscribe;
    }, []);

    const setGuestMode = (guestMode: boolean) => {
        setIsGuest(guestMode);
    };

    const logout = async () => {
        if (isAuthenticated) {
            try {
                // Set loading ke true saat memulai logout agar navigasi menunggu
                setLoading(true); 
                await signOut(auth); 
                // onAuthStateChanged akan memanggil setLoading(false) lagi setelah selesai
            } catch (error) {
                console.error("Gagal keluar:", error);
                throw error;
            }
        }
    };
    
    // 3. TAMBAHKAN LOADING KE 'value'
    const value = {
        user,
        isAuthenticated,
        isGuest,
        setGuestMode,
        logout, 
        loading, // <-- Sertakan state loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};