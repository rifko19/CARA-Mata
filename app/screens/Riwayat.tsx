import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

// Tipe data untuk riwayat
type RiwayatItem = {
    id: string;
    title: string;
    date: string;
    status: "Terdeteksi" | "Tidak Ada";
    };

    const Riwayat = ({ navigation }: any) => {
    // Data riwayat pemindaian
        const [riwayatData] = useState<RiwayatItem[]>([
            { id: "1", title: "Katarak Nuklear", date: "10/5/2023 14:30", status: "Terdeteksi" },
            { id: "2", title: "Katarak Nuklear", date: "15/4/2023 10:15", status: "Terdeteksi" },
            { id: "3", title: "Tidak Terdeteksi Katarak", date: "22/3/2023 16:45", status: "Tidak Ada" },
            { id: "4", title: "Tidak Terdeteksi Katarak", date: "5/2/2023 09:30", status: "Tidak Ada" },
        ]);

        // Render item riwayat
        const renderItem = ({ item }: { item: RiwayatItem }) => {
            return (
            <TouchableOpacity
                onPress={() => navigation.navigate("DetailRiwayat", { riwayatId: item.id })}
                className="bg-white p-4 mb-4 rounded-lg shadow-sm"
                >
                <View className="flex-row justify-between items-center mb-2">

                    <View className="flex-row items-center">
                        <Text className="ml-2 text-lg font-extrabold text-gray-700">{item.title}</Text>
                    </View>

                    <View className="flex-row items-center ">
                    <TouchableOpacity
                        style={{
                        backgroundColor: getStatusColor(item.status),
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        }}
                    >
                        <Text className="text-white text-xs">{item.status}</Text>
                    </TouchableOpacity>
                    <Ionicons className="ml-2" name="chevron-forward" size={20} color="#4B4B4B" />
                    </View>
                </View>

                <View className="flex-col">
                    <View className="flex-row items-center ">
                    <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                    <Text className="ml-2 text-sm text-gray-400">{item.date}</Text>
                    </View>
                </View>
            </TouchableOpacity>

            );
    };

    const getStatusColor = (status: "Terdeteksi" | "Tidak Ada") => {
        switch (status) {
        case "Terdeteksi":
            return "#FF0000";
        case "Tidak Ada":
            return "#10B981";
        default:
            return "#7D7D7D";
        }
    };

    return (
        <View className="flex-1 bg-blue-50 px-5 py-6">

        <FlatList
            data={riwayatData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
        />
        </View>
    );
    };

export default Riwayat;
