import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { auth } from '../../services/firebaseConfig';
import { signInWithEmailAndPassword } from "firebase/auth"; // Firebase Auth function

export default function LoginScreen() {
    const navigation = useNavigation();
    const tabNav = useNavigation();

    // State to handle inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // State to handle loading

    // Handle sign in
    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in both email and password');
            return;
        }

        setLoading(true); // Start loading animation

        try {
            // Firebase Auth sign-in
            await signInWithEmailAndPassword(auth, email, password);

            navigation.reset({
                index: 0,
                routes: [{ name: 'Tabs' as never}]
            });
        } catch (error) {
            // Ensure the error is of type 'Error' before accessing 'message'
            if (error instanceof Error) {
                Alert.alert('Login Error', error.message);
            } else {
                Alert.alert('Login Error', 'An unknown error occurred');
            }
        } finally {
            setLoading(false); // Stop loading animation
        }
    };

    return (
        <View className="flex-1 p-8">
            {/* Back Button */}
            <View className='flex-row justify-start items-center mt-5'>
                <TouchableOpacity onPress={() => navigation.navigate('Welcome' as never)}>
                    <AntDesign name="left" size={24} color="black" />
                </TouchableOpacity>
                <Text className='text-lg'>Kembali</Text>
            </View>

            <View className='justify-center items-center mt-24'>
                <Text className='text-3xl font-extrabold text-blue-700'>Login</Text>
            </View>

            <View className="bg-white rounded-t-3xl flex-grow mt-24">
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

                {/* Sign In Button */}
                <TouchableOpacity
                    className="bg-blue-600 w-full rounded-full py-4 items-center shadow-lg mb-6"
                    onPress={handleSignIn}
                    disabled={loading} // Disable button while loading
                >
                    {loading ? (
                        // Show ActivityIndicator when loading
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text className="text-white text-lg font-bold">
                            Masuk
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Already have account */}
                <View className='flex-row items-center justify-center'>
                    <Text className="font-medium text-sm">Belum Memiliki Akun? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Sign' as never)}>
                        <Text className="text-blue-700 font-semibold text-sm">Sign-Up</Text>
                    </TouchableOpacity>
                </View>

                {/* OR Separator */}
                <View className="flex-row items-center my-4">
                    <View className="flex-1 h-px bg-gray-300" />
                    <Text className="text-gray-500 mx-4 text-sm">ATAU</Text>
                    <View className="flex-1 h-px bg-gray-300" />
                </View>

                {/* Google Sign In Button */}
                <TouchableOpacity
                    className="bg-white w-full rounded-full py-4 items-center border border-gray-300 flex-row justify-center shadow-md mt-4"
                >
                    <AntDesign name="google" size={24} color="#DB4437" />
                    <Text className="text-gray-700 text-lg font-bold ml-3">
                        Masuk dengan Google
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
