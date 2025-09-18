import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithCredential
    } from 'firebase/auth';
    import { GoogleSignin } from '@react-native-google-signin/google-signin';
    import { auth } from '../../services/firebaseConfig';

    const AuthContext = createContext({});

    export const useAuth = () => useContext(AuthContext);

    export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Configure Google Sign-in
        GoogleSignin.configure({
        webClientId: 'your-web-client-id.apps.googleusercontent.com', // From Firebase Console
        });

        const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Email/Password Sign Up
    const signUp = async (email, password, fullName, phoneNumber) => {
        try {
        setLoading(true);
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update user profile with display name
        await updateProfile(result.user, {
            displayName: fullName
        });

        return { success: true, user: result.user };
        } catch (error) {
        return { success: false, error: error.message };
        } finally {
        setLoading(false);
        }
    };

    // Email/Password Sign In
    const signIn = async (email, password) => {
        try {
        setLoading(true);
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: result.user };
        } catch (error) {
        return { success: false, error: error.message };
        } finally {
        setLoading(false);
        }
    };

    // Google Sign In
    const signInWithGoogle = async () => {
        try {
        setLoading(true);
        
        // Check if device supports Google Play
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        
        // Get user info from Google
        const { idToken } = await GoogleSignin.signIn();
        
        // Create credential with Google ID token
        const googleCredential = GoogleAuthProvider.credential(idToken);
        
        // Sign in with credential
        const result = await signInWithCredential(auth, googleCredential);
        
        return { success: true, user: result.user };
        } catch (error) {
        return { success: false, error: error.message };
        } finally {
        setLoading(false);
        }
    };

    // Sign Out
    const logout = async () => {
        try {
        await signOut(auth);
        await GoogleSignin.signOut(); // Sign out from Google as well
        return { success: true };
        } catch (error) {
        return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        signUp,
        signIn,
        signInWithGoogle,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
        {children}
        </AuthContext.Provider>
    );
    };