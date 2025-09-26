import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, Alert } from "react-native";
import { useAuth } from "../services/AuthContext"; // Sesuaikan path

import ButtonAnimated from "components/ButtonAnimated";
import type { RootStackParamList } from "../navigation/RootStack";
import type { RootTabParamList } from "../navigation/RootTabs";

type Feature = {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    bg: string;
    to: keyof RootTabParamList;
    requiresAuth: boolean; // Added this property
};

const FeatureCard = ({ item, onPress }: { item: Feature; onPress: () => void }) => {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            className={`flex-1 overflow-hidden rounded-2xl ${item.bg} m-2 shadow-sm`}
            style={{
                flex: 1,
                margin: 8,
            }}
            onPress={onPress}
        >
            <ButtonAnimated>
                <View className={`items-center justify-center ${item.bg} py-4`}>
                    {item.icon}
                </View>

                <View className="items-center justify-center p-4 bg-white">
                    <Text className="text-base font-semibold text-gray-800 text-center">
                        {item.title}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-500 text-center">
                        {item.subtitle}
                    </Text>
                </View>
            </ButtonAnimated>
        </TouchableOpacity>
    );
};

export default function Beranda() {
    const tabNav = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { isAuthenticated, isGuest } = useAuth();

    const features: Feature[] = [
        {
            title: "Riwayat",
            subtitle: "Lihat pemindaian sebelumnya",
            bg: "bg-yellow-100",
            to: "Riwayat",
            requiresAuth: true, // Requires authentication
            icon: <Ionicons name="refresh-outline" size={23} color="#F59E0B" />,
        },
        {
            title: "Data Pasien",
            subtitle: "Kelola informasi pribadi",
            bg: "bg-green-100",
            to: "Profil",
            requiresAuth: true, // Requires authentication
            icon: <Ionicons name="document-text-outline" size={23} color="#10B981" />,
        },
        {
            title: "Klinik Terdekat",
            subtitle: "Temukan dokter mata",
            bg: "bg-purple-100",
            to: "Klinik",
            requiresAuth: true, // Requires authentication
            icon: <Ionicons name="location-outline" size={23} color="#6B21A8" />,
        },
        {
            title: "Wawasan",
            subtitle: "Pahami kesehatan mata",
            bg: "bg-blue-100",
            to: "Wawasan",
            requiresAuth: false, // Does not require authentication
            icon: <MaterialCommunityIcons name="book-alert" size={23} color="#2563EB" />,
        },
    ];

    const handleFeaturePress = (feature: Feature) => {
        // If feature requires auth and user is not authenticated
        if (feature.requiresAuth && !isAuthenticated) {
            Alert.alert(
                'Login Diperlukan',
                `Anda harus login untuk mengakses ${feature.title}`,
                [
                    {
                        text: 'Batal',
                        style: 'cancel',
                    },
                    {
                        text: 'Login',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );
            return;
        }

        // Navigate to the feature
        if (feature.to === "Wawasan") {
            navigation.navigate('Wawasan');
        } else {
            tabNav.navigate(feature.to);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-sky-50">
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} className="px-5">
                {/* Header */}
                <View className="items-center mt-24">
                    <Text className="mt-4 text-3xl font-extrabold text-blue-700">CARA-Mata</Text>
                    <Text className="mt-1 text-sm text-gray-500">
                        Cek Awal Risiko Abnormal pada Mata
                    </Text>
                    
                    {/* Guest Mode Indicator */}
                    {isGuest && !isAuthenticated && (
                        <View className="mt-2 bg-yellow-100 px-3 py-1 rounded-full">
                            <Text className="text-yellow-800 text-xs font-medium">
                                Mode Tamu - Login untuk fitur lengkap
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => tabNav.navigate("DeteksiStack")}
                    className="mt-6 flex-row items-center justify-center rounded-3xl bg-blue-600 px-5 py-4 shadow-lg"
                >
                    <View className="flex-row items-center">
                        <Ionicons name="camera-outline" size={23} color="#fff" />
                        <Text className="ml-3 mr-3 text-lg font-extrabold text-white">
                            Mulai Pengecekan Mata
                        </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={19} color="#fff" />
                </TouchableOpacity>
                <Text className="mt-2 text-center text-xs text-gray-500">
                    Pemindaian cepat hanya dalam 2 menit
                </Text>

                <View className="ml-3">
                    <Text className="mt-6 text- font-semibold text-gray-800">Fitur Utama</Text>
                </View>

                <View className="mt-3">
                    <View className="flex-row">
                        <FeatureCard 
                            item={features[0]} 
                            onPress={() => handleFeaturePress(features[0])} 
                        />
                        <FeatureCard 
                            item={features[1]} 
                            onPress={() => handleFeaturePress(features[1])} 
                        />
                    </View>
                    <View className="flex-row">
                        <FeatureCard 
                            item={features[2]} 
                            onPress={() => handleFeaturePress(features[2])} 
                        />
                        <FeatureCard 
                            item={features[3]} 
                            onPress={() => handleFeaturePress(features[3])} 
                        />
                    </View>
                </View>

                {/* Tentang */}
                <View className="mt-5 overflow-hidden rounded-2xl bg-white shadow">
                    <View className="bg-blue-600 px-4 py-3">
                        <Text className="text-white font-semibold">Tentang CARAMata</Text>
                    </View>
                    <View className="px-4 py-3">
                        <Text className="text-sm leading-5 text-gray-600">
                            CARAMata membantu mendeteksi tanda-tanda awal gangguan mata secara cepat
                            memakai kamera ponsel dan model analitik sederhana. Informasi bukan pengganti
                            diagnosis dokter. Konsultasikan hasil dengan klinik terdekat untuk tindak lanjut.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}