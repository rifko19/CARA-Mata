import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ImageBackground, Alert, ActivityIndicator } from 'react-native';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore'; // Pakai onSnapshot agar realtime
import { useAuth } from '../services/AuthContext'; 

const headerBg = require('../../assets/BG-9.jpg');

export default function ProfileScreen({ navigation }: any) {
    const { user, logout } = useAuth();
    
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        profilePic: '',
        gender: '',
        age: '',
        bloodType: '',
        nik: '',
        phone: ''
    });
    const [loading, setLoading] = useState(true);

    // Gunakan onSnapshot untuk update REAL-TIME saat data diedit di halaman sebelah
    useEffect(() => {
        if (!user) return;

        const db = getFirestore();
        const userDocRef = doc(db, 'users', user.uid);

        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData({
                    name: data.fullName || 'Nama Tidak Tersedia',
                    email: data.email || 'Email Tidak Tersedia',
                    profilePic: data.profilePic || '',
                    gender: data.gender || '-',
                    age: data.age || '-',
                    bloodType: data.bloodType || '-',
                    nik: data.nik || '-',
                    phone: data.phone || '-'
                });
            }
            setLoading(false);
        }, (error) => {
            console.error("Gagal ambil data profil:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);


    const handleLogout = () => {
        Alert.alert(
            "Konfirmasi Logout",
            "Anda yakin ingin keluar dari akun ini?",
            [
                { text: "Batal", style: "cancel" },
                { 
                    text: "Logout", 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            // Navigasi otomatis diatur oleh AuthContext (ke Welcome/Login)
                        } catch (error) {
                            Alert.alert("Error", "Gagal logout.");
                        }
                    } 
                }
            ]
        );
    };

    // Cek apakah data sudah lengkap
    const isDataComplete = userData.profilePic && userData.name && userData.nik !== '-' && userData.phone !== '-';

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
            <ImageBackground
                source={headerBg}
                resizeMode="cover"
                className="h-64 p-6 relative"
                style={{ borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' }}
            >
                {/* Top Navigation: Tombol Edit */}
                <View className="flex-row justify-end mt-4 items-center mb-4">
                    <TouchableOpacity 
                        className='justify-center items-center p-2 rounded-full'
                        onPress={() => navigation.navigate('ProfileEdit')}
                    >
                        <Feather name="edit" size={25} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View className="flex-row justify-center mb-4">
                    <View className="justify-center items-center">
                        {/* Gambar Profil */}
                        <Image
                            source={{ uri: userData.profilePic || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
                            className="w-28 h-28 rounded-full border-4 border-white"
                        />
                        <Text className="text-lg text-white">{userData.name || 'User Name'}</Text>
                    </View>
                </View>
            </ImageBackground>


            {/* Main Content Card */}
            <View className="px-5 mx-2 mt-8 pb-10">
                
                {/* Kartu Data Pribadi */}
                <View className="bg-white p-5 rounded-3xl shadow-sm mb-4">
                    <View className="flex-row items-center mb-4 border-b border-gray-100 pb-3">
                        <FontAwesome5 name="id-card" size={18} color="#2563EB" />
                        <Text className="text-lg font-bold text-gray-800 ml-2">Data Pribadi</Text>
                    </View>

                    <View className="space-y-4">
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 font-medium">NIK</Text>
                            <Text className="text-gray-800 font-semibold">{userData.nik}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 font-medium">Nama</Text>
                            <Text className="text-gray-800 font-semibold">{userData.name}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 font-medium">Email</Text>
                            <Text className="text-gray-800 font-semibold">{userData.email}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 font-medium">No. Handphone</Text>
                            <Text className="text-gray-800 font-semibold">{userData.phone}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 font-medium">Jenis Kelamin</Text>
                            <Text className="text-gray-800 font-semibold">{userData.gender}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 font-medium">Usia</Text>
                            <Text className="text-gray-800 font-semibold">{userData.age} Tahun</Text>
                        </View>
                        
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 font-medium">Golongan Darah</Text>
                            <View className="bg-blue-100 px-3 py-0.5 rounded-md">
                                <Text className="text-blue-700 font-bold">{userData.bloodType}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tombol Lengkapi Data (HANYA MUNCUL JIKA DATA BELUM LENGKAP) */}
                {!isDataComplete && (
                    <TouchableOpacity
                        className="bg-blue-600 w-full rounded-2xl py-4 flex-row justify-center items-center shadow-lg shadow-blue-200 mb-4"
                        onPress={() => navigation.navigate('ProfileEdit')} 
                    >
                        <Ionicons name="create-outline" size={20} color="white" style={{marginRight: 8}} />
                        <Text className="text-white text-lg font-bold">Lengkapi Data Sekarang</Text>
                    </TouchableOpacity>
                )}
                
                {/* Tombol Logout */}
                <TouchableOpacity
                    className="bg-red-50 w-full rounded-2xl py-4 flex-row justify-center items-center border border-red-100"
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{marginRight: 8}} />
                    <Text className="text-red-500 text-lg font-bold">Keluar Akun</Text>
                </TouchableOpacity>

            </View>
        </ScrollView>
    );
}