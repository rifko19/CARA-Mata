import React, { useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Menggunakan hook navigasi
import { useAuth } from '../services/AuthContext'; // Mengimpor AuthContext

const Wawasan = () => {
    const navigation = useNavigation();
    const { isAuthenticated } = useAuth();

    const articles = [
        { title: "Apa itu Katarak?", tags: ["katarak", "dasar"], description: "Penjelasan lengkap tentang katarak, penyebab, dan jenisnya." },
        { title: "Cara Mencegah Katarak", tags: ["pencegahan", "gaya hidup"], description: "Tips dan strategi untuk mencegah atau memperlambat perkembangan katarak." },
        { title: "Kapan Harus ke Dokter?", tags: ["konsultasi", "dokter"], description: "Panduan mengenai tanda-tanda yang mengharuskan konsultasi dengan dokter mata." }
    ];

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {

            if (!isAuthenticated) {
                Alert.alert(
                    'Login Diperlukan',
                    'Anda harus login untuk mengakses halaman Wawasan.',
                    [
                        { text: 'Batal', style: 'cancel' },
                        { text: 'Login', onPress: () => navigation.navigate('Login' as never) },
                    ]
                );
            }
        });

        return unsubscribe;
    }, [navigation, isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <View className="flex-1 justify-center items-center bg-white p-4">
                <Text className="text-lg text-center text-gray-600">Anda harus login untuk mengakses halaman ini.</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white p-4">
            {/* Header */}
            <View className="mb-6 ml-3">
                <Text className="text-2xl font-bold">Edukasi Kesehatan Mata</Text>
                <Text className="text-sm text-gray-600">Pelajari tentang katarak dan kesehatan mata</Text>
            </View>

            {/* Search bar */}
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2 mb-6">
                <TextInput
                    placeholder="Cari artikel, tips, atau FAQ..."
                    className="flex-1 text-sm text-gray-600"
                />
            </View>

            {/* Category Tabs */}
            <View className="flex-row mb-4">
                <TouchableOpacity className="bg-blue-500 text-white py-2 px-4 rounded-full mr-2">
                    <Text className="text-white">Artikel</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-gray-200 py-2 px-4 rounded-full mr-2">
                    <Text className="text-gray-600">Tips Pencegahan</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-gray-200 py-2 px-4 rounded-full">
                    <Text className="text-gray-600">FAQ</Text>
                </TouchableOpacity>
            </View>

            {/* Articles List */}
            <ScrollView className="flex-1">
                {articles.map((article, index) => (
                    <TouchableOpacity
                        key={index}
                        className="bg-white border border-gray-300 p-4 mb-4 rounded-xl"
                    >
                        <Text className="text-lg font-semibold">{article.title}</Text>
                        <Text className="text-sm text-gray-600">{article.description}</Text>
                        <View className="flex-row justify-between mt-2">
                            <View className="flex-row">
                                {article.tags.map((tag, tagIndex) => (
                                    <Text key={tagIndex} className="text-xs text-blue-500 mr-2">{tag}</Text>
                                ))}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default Wawasan;
