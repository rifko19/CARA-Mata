import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { DeteksiStackParamList } from "app/navigation/DeteksiStack";

export default function InstruksiPemindaian() {
    const navigation = useNavigation<StackNavigationProp<DeteksiStackParamList>>();

    return (
        <SafeAreaView className="flex-1 bg-sky-50">
        <ScrollView className="px-5 py-6">
            {/* Header */}
            <View className="mt-6 bg-white rounded-xl p-4 shadow-md">
                <Text className="text-xl font-semibold text-gray-800">Persiapan Pemindaian</Text>
                <Text className="mt-1 text-sm text-gray-500">Ikuti panduan berikut untuk hasil terbaik:</Text>

                {/* Pencahayaan */}
                <View className="mt-4 flex-row items-start">
                    <Ionicons name="bulb-outline" size={20} color="#FFA500" />
                    <View className="ml-3">
                    <Text className="text-base text-gray-950">Pencahayaan</Text>
                    <Text className="text-xs text-gray-500">Pastikan ruangan memiliki cahaya yang cukup terang</Text>
                    </View>
                </View>

                {/* Posisi Kamera */}
                <View className="mt-4 flex-row items-start">
                    <Ionicons name="camera-outline" size={20} color="#4CAF50" />
                    <View className="ml-3">
                    <Text className="text-base text-gray-950">Posisi Kamera</Text>
                    <Text className="text-xs text-gray-500">Pegang ponsel dengan stabil, jarak 20-30 cm dari mata</Text>
                    </View>
                </View>

                {/* Posisi Mata */}
                <View className="mt-4 flex-row items-start">
                    <Ionicons name="eye-outline" size={20} color="#2196F3" />
                    <View className="ml-3">
                    <Text className="text-base text-gray-950">Posisi Mata</Text>
                    <Text className="text-xs text-gray-500">Buka mata lebar-lebar dan tatap langsung ke kamera</Text>
                    </View>
                </View>
                </View>

            {/* Tombol Mulai Pemindaian */}
            <TouchableOpacity
            onPress={() => navigation.navigate("Deteksi")}
            className="mt-6 items-center justify-center rounded-3xl bg-blue-600 py-4 shadow-lg"
            >
            <View className="flex-row items-center">
                <Ionicons name="camera-outline" size={23} color="#fff" />
                <Text className="ml-3 text-center text-xl font-semibold text-white">Mulai Pemindaian</Text>
            </View>
            </TouchableOpacity>
        </ScrollView>
        </SafeAreaView>
    );
    }
