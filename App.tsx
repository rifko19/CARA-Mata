import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './app/navigation/AppNavigator';
import { auth } from './app/services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import "react-native-gesture-handler";
import "react-native-reanimated";
import "./global.css";
import { AuthProvider } from './app/services/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}