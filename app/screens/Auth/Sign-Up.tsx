import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import React from 'react';
import { auth, firestore } from '../../services/firebaseConfig';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignUpScreen() {
    const navigation = useNavigation();

    const [fullName, setFullName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSignUp = async () => {
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(firestore, "users", user.uid), {
                fullName,
                email,
                phone,
                createdAt: serverTimestamp(),
            });

            navigation.navigate('Login' as never);
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Sign Up Error', error.message);
            } else {
                Alert.alert('Sign Up Error', 'An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 p-8 bg-white">
            {/* Back Button */}
            <View className='flex-row justify-start items-center mt-5'>
                <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                    <AntDesign name="left" size={24} color="black" />
                </TouchableOpacity>
                <Text className='text-lg'>Kembali</Text>
            </View>

            <View className='justify-center items-center' style={{ marginTop: 20, marginBottom: 20 }}>
                <Text className='text-3xl font-extrabold text-blue-700'>Sign Up</Text>
            </View>

            <View className="bg-white rounded-t-3xl flex-grow mt-16">
                {/* Full Name Input */}
                <View className="flex-row items-center border border-gray-300 rounded-full px-4 py-3 mb-4">
                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-gray-800"
                        placeholder="Nama Lengkap"
                        placeholderTextColor="#9CA3AF"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>

                {/* Email Input */}
                <View className="flex-row items-center border border-gray-300 rounded-full px-4 py-3 mb-4">
                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-gray-800"
                        placeholder="Email"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                {/* Phone Number Input */}
                <View className="flex-row items-center border border-gray-300 rounded-full px-4 py-3 mb-4">
                    <Ionicons name="call-outline" size={20} color="#6B7280" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-gray-800"
                        placeholder="Nomor Telepon"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />
                </View>

                {/* Password Input */}
                <View className="flex-row items-center border border-gray-300 rounded-full px-4 py-3 mb-4">
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-gray-800"
                        placeholder="Kata Sandi"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity>
                        <Ionicons name="eye-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Confirm Password Input */}
                <View className="flex-row items-center border border-gray-300 rounded-full px-4 py-3 mb-6">
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-gray-800"
                        placeholder="Konfirmasi Kata Sandi"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity>
                        <Ionicons name="eye-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                    className="bg-blue-600 w-full rounded-full py-4 items-center shadow-lg mb-6"
                    onPress={handleSignUp}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text className="text-white text-lg font-bold">Daftar</Text>
                    )}
                </TouchableOpacity>

                {/* Already have account */}
                <View className='flex-row items-center justify-center'>
                    <Text className="font-medium text-sm">Sudah Memiliki Akun? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                        <Text className="text-blue-700 font-semibold text-sm">Login</Text>
                    </TouchableOpacity>
                </View>

                {/* OR Separator */}
                <View className="flex-row items-center my-4">
                    <View className="flex-1 h-px bg-gray-300" />
                    <Text className="text-gray-500 mx-4 text-sm">ATAU</Text>
                    <View className="flex-1 h-px bg-gray-300" />
                </View>

                {/* Google Sign Up Button */}
                <TouchableOpacity
                    className="bg-white w-full rounded-full py-4 items-center border border-gray-300 flex-row justify-center shadow-md mt-4"
                >
                    <AntDesign name="google" size={24} color="#DB4437" />
                    <Text className="text-gray-700 text-lg font-bold ml-3">Daftar dengan Google</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
