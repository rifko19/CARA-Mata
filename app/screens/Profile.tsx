import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../services/AuthContext'; 

const headerBg = require('../../assets/BG-9.jpg');

export default function ProfileScreen({ navigation }: any) {
    const { user, isAuthenticated, logout } = useAuth();
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        profilePic: '',
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                const db = getFirestore();
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    // Menyimpan data ke state jika data ada
                    setUserData({
                        name: docSnap.data().fullName || 'Nama Tidak Tersedia',
                        email: docSnap.data().email || 'Email Tidak Tersedia',
                        profilePic: docSnap.data().profilePic || '',
                    });
                } else {
                    Alert.alert('Data tidak ditemukan', 'Pengguna tidak ditemukan di Firestore');
                }
            }
        };

        fetchUserData();
    }, [user]); 
    useEffect(() => {
        if (user && (!userData.profilePic || !userData.name)) {
            console.log('Pengguna perlu melengkapi data profil');
        }
    }, [userData, user, navigation]);


    const handleLogout = () => {
        Alert.alert(
            "Konfirmasi Logout",
            "Anda yakin ingin keluar dari akun ini?",
            [
                {
                    text: "Batal",
                    style: "cancel"
                },
                { 
                    text: "Logout", 
                    onPress: async () => {
                        try {
                            await logout();
                            navigation.navigate('Welcome');
                        } catch (error) {
                            console.error("Gagal logout:", error);
                            Alert.alert("Error", "Gagal melakukan logout. Silakan coba lagi.");
                        }
                    } 
                }
            ]
        );
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
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
            <View className="bg-white mx-4 mt-12 p-6 rounded-3xl shadow-lg">
                {/* Account Information Section */}
                <View className="mb-6">
                    <View className="flex-row items-center mb-2">
                        <FontAwesome5 name="user-circle" size={20} color="#6B7280" />
                        <Text className="text-lg font-bold text-gray-700 ml-2">Informasi Akun</Text>
                    </View>
                    <View className="border-t border-gray-200 pt-4">
                        <View className="flex-row justify-between items-center p-2">
                            <Text className="text-gray-600 font-medium">Nama Lengkap</Text>
                            <Text className="text-gray-800">{userData.name || 'Belum melengkapi'}</Text>
                        </View>
                        <View className="flex-row justify-between items-center p-2">
                            <Text className="text-gray-600 font-medium">Email</Text>
                            <Text className="text-gray-800">{userData.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Tombol Lengkapi Data (Conditional) */}
                {(!userData.profilePic || !userData.name) && (
                    <TouchableOpacity
                        className="bg-blue-600 w-full rounded-full py-4 items-center shadow-lg mt-4"
                        onPress={() => navigation.navigate('ProfileEdit')} 
                    >
                        <Text className="text-white text-lg font-bold">Lengkapi Data</Text>
                    </TouchableOpacity>
                )}
                
                {/* Tombol Logout */}
                <TouchableOpacity
                    className="bg-red-500 w-full rounded-full py-4 items-center shadow-lg mt-4"
                    onPress={handleLogout}
                >
                    <Text className="text-white text-lg font-bold">Logout</Text>
                </TouchableOpacity>

            </View>
        </ScrollView>
    );
}