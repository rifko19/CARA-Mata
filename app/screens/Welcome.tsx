import React from 'react';
import { View, Text, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';

// Dummy logo image - Ganti dengan path logo Anda
const appLogo = require('../../assets/On-Board-Assets2.png');

export default function WelcomeScreen() {
    const navigation = useNavigation();


    return (
        <View className="flex-1 bg-white">
            <ImageBackground
                source={require('../../assets/BG-ONBOARD.jpg')}
                resizeMode="cover"
                className="flex-1"
            >
        <View className='justify-center items-center px-8 pt-44 '>
        <Image
            source={appLogo}
            className="w-48 h-48 my-8"
            resizeMode="contain"
        />

        <Text className="text-3xl font-bold text-gray-800 text-center mb-4">
            Selamat Datang!
        </Text>
        <Text className="text-base font-semibold text-green-700 text-center">
            Kesehatan mata Anda, kendali Anda.
        </Text>
        <Text className="text-base font-semibold text-green-700 text-center mb-4">
            Mata sehat, hidup lebih bahagia.
        </Text>
        <Text className="text-base font-thin text-center">
            Login untuk mendapatkan
        </Text>
        <Text className="text-base font-thin text-center">
            pengalaman yang lebih maksimal
        </Text>
        </View>

        <View className='p-8'>
        <TouchableOpacity
            className="bg-blue-700 w-full rounded-full py-4 items-center"
            onPress={() => navigation.navigate('Login' as never)}
        >
            <Text className="text-white text-lg font-bold">
            Login
            </Text>
        </TouchableOpacity>

        <View className="flex-row items-center my-5">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="text-gray-500 mx-2">atau</Text>
            <View className="flex-1 h-px bg-gray-300" />
        </View>

        <TouchableOpacity
            className="w-full rounded-full py-4 items-center border border-gray-400"
            onPress={() => navigation.navigate('Tabs' as never)}
        >
            <Text className="text-gray-600 text-lg font-bold">
            Lewati
            </Text>
        </TouchableOpacity>
        
        </View>
        </ImageBackground>
        </View>
        
    );
    }