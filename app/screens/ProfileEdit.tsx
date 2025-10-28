import { AntDesign, Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from '@react-navigation/native';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { RootTabParamList } from "../navigation/RootTabs";
import { useAuth } from '../services/AuthContext';

export default function ProfileEdit() {
    const { user } = useAuth();
    const navigation = useNavigation();
    const tabNav = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Fungsi untuk memilih foto
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.cancelled) {
            setProfilePic(result.uri);
        }
    };

    const saveProfileData = async () => {
        if (!gender || !age || !bloodType || !profilePic) {
            Alert.alert('Error', 'Semua kolom harus diisi');
            return;
        }

        setLoading(true);

        const storage = getStorage();
        const response = await fetch(profilePic);
        const blob = await response.blob();
        const storageRef = ref(storage, 'profilePics/' + user.uid);
        await uploadBytes(storageRef, blob);

        const photoURL = await getDownloadURL(storageRef);

        const db = getFirestore();
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            gender,
            age,
            bloodType,
            profilePic: photoURL,
        });

        setLoading(false);
        Alert.alert('Berhasil', 'Data profil berhasil diperbarui');
        navigation.goBack();
    };

    return (
        <View className="flex-1 p-6 bg-white">
            <View className='flex-row justify-start items-center mt-5'>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <AntDesign name="left" size={24} color="black" />
                </TouchableOpacity>
                <Text className='text-lg'>Kembali</Text>
            </View>
            {/* Pilih Foto */}
            <TouchableOpacity onPress={pickImage} className="items-center mb-6">
                {profilePic ? (
                    <Image source={{ uri: profilePic }} className="w-32 h-32 rounded-full border-4 border-gray-300" />
                ) : (
                    <Ionicons name="camera-outline" size={50} color="#2563EB" />
                )}
                <Text className="mt-2 text-blue-500">Pilih Foto Profil</Text>
            </TouchableOpacity>

            {/* Form Input Data Medis */}
            <Text className="text-lg font-bold text-gray-800 mb-2">Jenis Kelamin</Text>
            <TextInput
                className="border border-gray-300 rounded-full p-3 mb-4"
                placeholder="Masukkan jenis kelamin"
                value={gender}
                onChangeText={setGender}
            />

            <Text className="text-lg font-bold text-gray-800 mb-2">Usia</Text>
            <TextInput
                className="border border-gray-300 rounded-full p-3 mb-4"
                placeholder="Masukkan usia"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
            />

            <Text className="text-lg font-bold text-gray-800 mb-2">Golongan Darah</Text>
            <TextInput
                className="border border-gray-300 rounded-full p-3 mb-4"
                placeholder="Masukkan golongan darah"
                value={bloodType}
                onChangeText={setBloodType}
            />

            {/* Tombol Simpan */}
            <TouchableOpacity
                className="bg-blue-600 w-full rounded-full py-4 items-center shadow-lg mb-6"
                onPress={saveProfileData}
                disabled={loading}
            >
                {loading ? (
                    <Text className="text-white text-lg font-bold">Memuat...</Text>
                ) : (
                    <Text className="text-white text-lg font-bold">Simpan Data</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
