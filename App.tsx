import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './app/navigation/AppNavigator';
import { auth } from './app/services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import "react-native-gesture-handler";
import "react-native-reanimated";
import "./global.css";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Memeriksa status login pengguna saat aplikasi dimulai
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                setIsAuthenticated(true); // Jika pengguna sudah login
            } else {
                setIsAuthenticated(false); // Jika pengguna belum login
            }
        });
        return unsubscribe; // Hapus listener ketika komponen tidak lagi digunakan
    }, []);
  return <AppNavigator isAuthenticated={isAuthenticated} />;
}
