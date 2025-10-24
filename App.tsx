import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './app/navigation/AppNavigator';
import { AuthProvider, useAuth } from './app/services/AuthContext'; 
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'; 
import "react-native-gesture-handler";
import "react-native-reanimated";
import "./global.css";


const RootWrapper = () => {
    const { loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Memuat sesi pengguna...</Text>
            </View>
        );
    }
    return (
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <RootWrapper /> 
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 10,
        color: '#2563EB',
        fontSize: 16,
    }
});