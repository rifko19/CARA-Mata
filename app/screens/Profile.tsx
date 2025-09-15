import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const dummyUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    // profilePic: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    };

const headerBg = require('../../assets/BG-9.jpg');


    export default function ProfileScreen() {
    return (
        <ScrollView className="flex-1 bg-gray-50">
            
        <ImageBackground
        source={headerBg}
        resizeMode="cover"
        className="h-64 p-6 relative"
        style={{ borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' }}
        >
            {/* Top Navigation */}
            <View className="flex-row justify-end mt-4 items-center mb-4">
            <TouchableOpacity className='justify-center items-center p-2 rounded-full '>
                <Feather name="edit" size={25} color="#FFFFFF" />
            </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mb-">
            <View className="justify-center items-center">
            <Image
                source={require('../../assets/ProfilePict.jpg')}
                className="w-28 h-28 rounded-full border-4 border-white"
            />
            <Text className="text-lg color-white">UserName</Text>
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
                <Text className="text-gray-800">{dummyUser.name}</Text>
                </View>
                <View className="flex-row justify-between items-center p-2">
                <Text className="text-gray-600 font-medium">Email</Text>
                <Text className="text-gray-800">{dummyUser.email}</Text>
                </View>
            </View>
            </View>

            {/* Medical Information Section */}
            <View>
            <View className="flex-row items-center mb-2">
                <FontAwesome5 name="stethoscope" size={20} color="#6B7280" />
                <Text className="text-lg font-bold text-gray-700 ml-2">Info Medis</Text>
            </View>
            <View className="border-t border-gray-200 pt-4">
                <View className="flex-row justify-between items-center p-2">
                <Text className="text-gray-600 font-medium">Golongan Darah</Text>
                <Text className="text-gray-800">O+</Text>
                </View>
                <View className="flex-row justify-between items-center p-2">
                <Text className="text-gray-600 font-medium">Riwayat Alergi</Text>
                <Text className="text-gray-800">Tidak ada</Text>
                </View>
            </View>
            </View>
        </View>
        </ScrollView>
    );
    }