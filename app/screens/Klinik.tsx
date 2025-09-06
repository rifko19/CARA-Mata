import React, { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Tipe data untuk klinik
type KlinikItem = {
    id: string;
    name: string;
    address: string;
    distance: string;
    phone: string;
    hours: string;
    specialties: string[];
    rating: number;
    latitude: number;
    longitude: number;
    };

    const Klinik = () => {
    const [searchQuery, setSearchQuery] = useState("");

    const klinikData: KlinikItem[] = [
        {
        id: "1",
        name: "Pusat Perawatan Mata",
        address: "Jl. Sudirman No. 123, Jakarta",
        distance: "2,3 km jauhnya",
        phone: "+62-82181682461",
        hours: "Senin-Jumat 8:00 - 17:00",
        specialties: ["Operasi Katarak", "Pengobatan Glaukoma"],
        rating: 4.8,
        latitude: -6.200,
        longitude: 106.822,
        },
        {
        id: "2",
        name: "Spesialis Penglihatan",
        address: "Jl. Gatot Subroto No. 45, Jakarta",
        distance: "4,1 km jauhnya",
        phone: "+62-21-5557890",
        hours: "Senin-Sabtu 9:00 - 18:00",
        specialties: ["Operasi Katarak", "LASIK"],
        rating: 4.5,
        latitude: -6.210,
        longitude: 106.830,
        },
        {
        id: "3",
        name: "Rumah Sakit Mata Jakarta",
        address: "Jl. Thamrin No. 78, Jakarta",
        distance: "5,7 km jauhnya",
        phone: "+62-21-5550912",
        hours: "Senin-Jumat 8:00 - 17:00",
        specialties: ["Operasi Katarak", "Pengobatan Glaukoma", "LASIK"],
        rating: 4.9,
        latitude: -6.212,
        longitude: 106.822,
        },
    ];

    // Memfilter berdasarkan query pencarian
    const filteredKlinikData = klinikData.filter((klinik) =>
        klinik.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        klinik.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: KlinikItem }) => (
        <View className="bg-white p-5 mb-4 rounded-lg shadow-sm">
        {/* Nama Klinik dan Rating */}
        <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
            <View className="flex-row items-center">
            <Text className="text-yellow-400">{item.rating.toFixed(1)}</Text>
            <Ionicons name="star" size={16} color="#FFD700" />
            </View>
        </View>

        {/* Alamat dan Jarak */}
        <Text className="text-sm text-gray-600 mt-2">{item.address}</Text>
        <Text className="text-sm text-blue-500">{item.distance}</Text>

        {/* Nomor Telepon dan Jam Buka */}
        <View className="mt-3">
            <Text className="text-sm text-gray-600">Telepon: {item.phone}</Text>
            <Text className="text-sm text-gray-600">Jam: {item.hours}</Text>
        </View>

        {/* Spesialisasi */}
        <View className="flex-row flex-wrap mt-3">
            {item.specialties.map((specialty, index) => (
            <Text
                key={index}
                className="text-xs text-black bg-gray-100 rounded-full px-3 py-1 mr-2 mt-1"
            >
                {specialty}
            </Text>
            ))}
        </View>

        {/* Tombol Buat Janji dan Lihat Lokasi */}
        <View className="flex-row justify-between items-center mt-4">
            {/* Tombol Buat Janji - WhatsApp */}
            <TouchableOpacity
            onPress={() => Linking.openURL(`https://www.google.com/maps?q=${item.latitude},${item.longitude}`)} // Lihat lokasi di Google Maps
            className="bg-green-500 p-3 rounded-xl flex-row items-center"
            >
            <Ionicons name="location-outline" size={20} color="#fff" />
            <Text className="ml-2 text-white text-sm">Lihat Lokasi</Text>
            </TouchableOpacity>

            <TouchableOpacity
            onPress={() => Linking.openURL(`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=Halo,%20saya%20ingin%20membuat%20janji%20di%20klinik%20ini.`)} // Buat janji lewat WhatsApp
            className="bg-blue-600 p-3 rounded-xl flex-row items-center"
            >
            <Text className="text-white text-sm">Buat Janji</Text>
            </TouchableOpacity>
        </View>
        </View>
    );

    return (
        <View className="flex-1 bg-blue-50 px-5 py-6">
        {/* Kolom Pencarian */}
        <TextInput
            placeholder="Cari klinik..."
            className="bg-white p-3 rounded-lg mb-6 border border-gray-300"
            value={searchQuery}
            onChangeText={setSearchQuery}
        />

        {/* Daftar Klinik */}
        <FlatList
            data={filteredKlinikData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
        />
        </View>
    );
    };

export default Klinik;
