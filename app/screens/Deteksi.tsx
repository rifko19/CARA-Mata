import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera"; // Import dari expo-camera
import { useState } from "react";
import { Button, SafeAreaView, ScrollView, Text, TouchableOpacity, View, } from "react-native";


export default function Deteksi() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();

    if (!permission) {
    return <View />;
}

    if (!permission.granted) {
        return (
        <SafeAreaView className="flex-1 bg-sky-50">
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} className="px-5">
            <View className="relative mt-6 bg-gray-200 h-56 rounded-xl">
                <Text className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-semibold">
                Tahan dengan stabil untuk pengambilan gambar
                </Text>
            </View>

            <Text className="text-center text-sm text-gray-500">
                Kami butuh izin untuk mengakses kamera perangkat Anda.
            </Text>
            <Button onPress={requestPermission} title="Grant Permission" />
            </ScrollView>
        </SafeAreaView>
        );
    }
    function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    }


    return (
        <SafeAreaView className="flex-1 bg-sky-50">
        <ScrollView className="px-5">
            {/* Kamera Preview */}
            <View className="relative mt-6 bg-gray-200 h-72 rounded-xl ">
                <CameraView
                    style={{ flex: 1, borderRadius: 16 }}
                    facing={facing}
                />
                    {/* <View className="absolute border-2 border-green-500 rounded-full w-40 h-40 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></View>
                    <Text className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-semibold">
                    Tahan dengan stabil untuk pengambilan gambar
                    </Text> */}
                    <TouchableOpacity
                        onPress={toggleCameraFacing}
                        className="absolute top-4 right-4 p-2 rounded-full shadow"
                        activeOpacity={0.7}>
                            <Ionicons name="camera-reverse-outline" size={33} color="#fff" />
                    </TouchableOpacity>
                {/* </CameraView> */}
            </View>

            <View className="mt-6 bg-white rounded-xl p-4 shadow-md">
                <Text className="text-lg font-semibold text-gray-800">Kondisi Pencahayaan</Text>
                <Text className="mt-1 text-sm text-gray-500">Penting untuk hasil yang akurat</Text>
                {/* Slider */}
                <View className="mt-3">
                    <Text className="text-xs text-gray-500">Buruk</Text>
                    <View className="w-full h-2 bg-gray-300 rounded-full mt-2">
                    <View className="h-2 bg-green-500 rounded-full" style={{ width: "70%" }} />
                    </View>
                    <Text className="text-xs text-gray-500 mt-2">Baik</Text>
                </View>
            </View>

            <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => console.log("Ambil Gambar Tertunda...")}
            className="mt-6 items-center justify-center rounded-3xl bg-blue-600 py-4 shadow-lg"
            >
            <View className="flex-row items-center">
                <Ionicons name="camera-outline" size={23} color="#fff" />
                <Text className="ml-3 text-center text-xl font-semibold text-white">
                Ambil Gambar
                </Text>
            </View>
            </TouchableOpacity>
        </ScrollView>
        </SafeAreaView>
    );
    }
