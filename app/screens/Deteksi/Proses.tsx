import React, { useState, useEffect } from "react";
import { SafeAreaView, Text, View, ActivityIndicator } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DeteksiStackParamList } from "app/navigation/DeteksiStack";

export default function PemindaianProgress() {
    const [progress, setProgress] = useState(0);
    const navigation = useNavigation<StackNavigationProp<DeteksiStackParamList>>();

    // Simulasi progress
    useEffect(() => {
        if (progress < 100) {
            const timer = setInterval(() => {
                setProgress((prevProgress) => {
                    const newProgress = prevProgress + 20;  // Setiap interval tambah 20%
                    if (newProgress >= 100) {
                        clearInterval(timer);
                        navigation.navigate("Hasil");  // Setelah selesai, navigasi ke halaman hasil
                    }
                    return newProgress;
                });
            }, 1000);  // Progress akan bertambah setiap detik
        }
    }, [progress, navigation]);

    return (
        <SafeAreaView className="flex-1 bg-sky-50 px-5 py-6">
            <Text className="text-xl font-semibold text-gray-800">Pindai Mata</Text>
            <Text className="text-sm text-gray-500 mt-2">Mengambil Gambar...</Text>
            <Text className="text-sm text-gray-500 mt-2">Mohon tetap diam sejenak</Text>

            {/* Activity Indicator untuk menunjukkan proses */}
            <View className="mt-6 flex items-center justify-center">
                <ActivityIndicator size="large" color="#2196F3" animating={progress < 100} />
                <Text className="text-xs text-gray-500 mt-2">Sedang memproses...</Text>
            </View>

            {/* Progress Bar Horizontal */}
            <View className="mt-6">
                <Text className="text-xs text-gray-500">Progress Pemindaian</Text>
                <View className="bg-gray-300 rounded-full h-2 mt-2 w-full">
                    <View
                        className="bg-blue-600 rounded-full h-2"
                        style={{ width: `${progress}%` }}
                    />
                </View>
                <Text className="text-xs text-gray-500 text-right mt-1">{progress}%</Text>
            </View>
        </SafeAreaView>
    );
}
