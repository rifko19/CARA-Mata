import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ProgressBar } from "react-native-paper";
import type { RootStackParamList } from "../../navigation/RootStack";
import type { RootTabParamList } from "../../navigation/RootTabs";
import { DeteksiStackParamList } from "app/navigation/DeteksiStack";

export default function HasilPemindaian() {
    const navigation = useNavigation<StackNavigationProp<DeteksiStackParamList>>();
    const tabNav = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

    return (
        <SafeAreaView className="flex-1 bg-sky-50 px-5 py-6">
            {/* Header */}
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <View className="mt-6 bg-white rounded-xl p-4 shadow-md">
                <Text className="text-2xl font-semibold text-gray-800">Hasil Pemindaian</Text>
                <Text className="text-sm text-gray-500 mt-2">15 Januari 2024 • 14:30</Text>

                {/* Status */}
                <View className="flex-row justify-between items-center mt-6">
                    <Text className="text-sm font-semibold text-gray-800">Mata Kanan</Text>
                    <View style={{
                        backgroundColor: "#FEF3C7",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        }}>
                    <Text className="text-xs font-semibold text-yellow-500">SEDANG</Text>
                </View>
                </View>

                {/* Jenis Katarak */}
                <View className="mt-4">
                    <Text className="text-sm text-gray-600">Jenis Katarak</Text>
                    <Text className="text-lg font-semibold text-gray-800">Katarak Nuklear</Text>
                </View>

                {/* Tingkat Kepercayaan */}
                <View className="mt-6">
                    <Text className="text-sm text-gray-600">Tingkat Kepercayaan</Text>
                    <ProgressBar progress={0.87} color="#2196F3" style={{ marginTop: 10 }} />
                    <Text className="text-xs text-gray-500 text-right mt-1">87%</Text>
                </View>

                {/* Area Terpengaruh */}
                <View className="mt-6">
                    <Text className="text-sm text-gray-600">Area Terpengaruh</Text>
                    <ProgressBar progress={0.35} color="#F56565" style={{ marginTop: 10 }} />
                    <Text className="text-xs text-gray-500 text-right mt-1">35%</Text>
                </View>
            </View>

            {/* Tabs */}
            <View className="flex-row mt-6 items-center border-b-2 border-gray-300" 
                style={{ backgroundColor: '#EBEBEB',
                    borderRadius: 12
                }}>
                <TouchableOpacity className="flex-1 rounded-xl p-3 bg-white" activeOpacity={0.7}>
                    <Text className="text-center text-gray-600 font-semibold">Ringkasan</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 py-2" activeOpacity={0.7}>
                    <Text className="text-center text-gray-600 font-semibold">Analisis</Text>
                </TouchableOpacity>
            </View>

            {/* Penjelasan Tingkat Keparahan */}
            <View className="mt-6 bg-white rounded-xl p-4 shadow-md">
                <Text className="text-lg font-semibold text-gray-800">Penjelasan Tingkat Keparahan</Text>
                <Text className="text-xs text-gray-500 mt-2">Perubahan yang terlihat pada lensa mata. Konsultasi dengan dokter diperlukan.</Text>
            </View>

            {/* Rekomendasi */}
            <View className="mt-6 bg-white rounded-xl p-4 shadow-md">
                <Text className="text-lg font-semibold text-gray-800">Rekomendasi</Text>
                <View className="mt-4">
                    <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                        <Text className="text-sm text-gray-600 ml-2">Konsultasi dengan dokter spesialis mata dalam 2-4 minggu</Text>
                    </View>
                    <View className="flex-row items-center mt-2">
                        <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                        <Text className="text-sm text-gray-600 ml-2">Hindari paparan sinar UV berlebihan</Text>
                    </View>
                    <View className="flex-row items-center mt-2">
                        <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                        <Text className="text-sm text-gray-600 ml-2">Konsumsi makanan kaya antioksidan</Text>
                    </View>
                    <View className="flex-row items-center mt-2">
                        <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                        <Text className="text-sm text-gray-600 ml-2">Periksa rutin setiap 6 bulan</Text>
                    </View>
                </View>
            </View>

            {/* Peringatan */}
            <View className="mt-6 p-4 rounded-xl shadow-md"
                style={{ backgroundColor: '#FEF3C7' }}>
                <Text className="text-sm font-semibold"
                style={{ color: '#B45309' }}
                >Perhatian!</Text>
                <Text className="text-xs mt-2"
                style={{ color: '#cc5e0a' }}
                >Hasil ini menunjukkan adanya indikasi katarak. Segera konsultasikan dengan dokter spesialis mata untuk pemeriksaan lebih lanjut dan penanganan yang tepat.</Text>
            </View>

            {/* Tombol */}
            <View className="flex-row justify-between items-center mt-4">
                {/* Tombol Pindai Lagi */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('Persiapan')}
                    className="bg-blue-600 py-3 px-5 rounded-lg flex-row items-center"
                >
                    <Ionicons name="camera-outline" size={20} color="#fff" />
                    <Text className="ml-2 text-white font-semibold">Pindai Lagi</Text>
                </TouchableOpacity>

                {/* Tombol Export PDF */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => console.log("Export PDF")} // Fungsikan sesuai kebutuhan Anda
                    className="py-3 px-5 rounded-lg flex-row items-center"
                    style={{ backgroundColor: '#16A34A' }}
                >
                    <Ionicons name="document-text-outline" size={20} color="#fff" />
                    <Text className="ml-2 text-white font-semibold">Export PDF</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </SafeAreaView>
    );
}
