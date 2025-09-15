import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, AntDesign } from '@expo/vector-icons'; 

export default function LoginScreen() {
    const navigation = useNavigation();

    return (
        <View className="flex-1 p-8">

            {/* Back Button */}
            <View className='flex-row justify-start items-center mt-5'>
            <TouchableOpacity
                className=""
                onPress={() => navigation.goBack()}
            >
                <AntDesign name="left" size={24} color="black" />
            </TouchableOpacity>
            <Text className='text-lg'>Kembali</Text>
            </View>

            {/* Login Form */}
            <View className="bg-white rounded-t-3xl pt-44 flex-grow">

                {/* Username or Email Input */}
                <View className="flex-row items-center border border-gray-300 rounded-full px-4 py-3 mb-4">
                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-gray-800"
                        placeholder="Username or Email"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                    />
                </View>

                {/* Password Input */}
                <View className="flex-row items-center border border-gray-300 rounded-full px-4 py-3 mb-4">
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-gray-800"
                        placeholder="Password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                    />
                    <TouchableOpacity>
                        <Ionicons name="eye-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Forgot Password Button */}
                <View className='flex-row justify-center'>
                <TouchableOpacity className="self-end mb-6">
                    <Text className="text-blue-700 font-semibold text-sm">Lupa Kata Sandi?</Text>
                </TouchableOpacity>
                </View>

                <TouchableOpacity
                    className="bg-blue-600 w-full rounded-full py-4 items-center shadow-lg mb-6"
                >
                    <Text className="text-white text-lg font-bold">
                        Log in
                    </Text>
                </TouchableOpacity>
                <View className='flex-row items-center justify-center'>
                <Text className="font-medium text-sm">Tidak Memiliki Akun?
                </Text>
                <TouchableOpacity>
                        <Text className="text-blue-700 font-semibold text-sm">Sign-Up</Text>
                </TouchableOpacity>
                </View>
                
                {/* OR Separator */}
                <View className="flex-row items-center my-4">
                    <View className="flex-1 h-px bg-gray-300" />
                    <Text className="text-gray-500 mx-4 text-sm">OR</Text>
                    <View className="flex-1 h-px bg-gray-300" />
                </View>

                {/* Google Login Button */}
                <TouchableOpacity
                    className="bg-white w-full rounded-full py-4 items-center border border-gray-300 flex-row justify-center shadow-md mt-4"
                >
                    <AntDesign name="google" size={24} color="#DB4437" />
                    <Text className="text-gray-700 text-lg font-bold ml-3">
                        Login with Google
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
