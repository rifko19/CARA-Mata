import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { doc, getFirestore, updateDoc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../services/AuthContext';
import { Picker } from '@react-native-picker/picker';

// --- FUNGSI UPLOAD CLOUDINARY (UNSIGNED) ---
const uploadToCloudinary = async (uri: string) => {
    const CLOUD_NAME = "deqqxqw6n"; 
    const UPLOAD_PRESET = "ProfilePict"; 

    const apiUploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    try {
        const base64Img = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        const dataUri = `data:image/jpeg;base64,${base64Img}`;

        const response = await fetch(apiUploadUrl, {
            method: 'POST',
            body: JSON.stringify({
                file: dataUri,
                upload_preset: UPLOAD_PRESET,
            }),
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        return data.secure_url;

    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw error;
    }
};

export default function ProfileEdit() {
    const { user } = useAuth();
    const navigation = useNavigation();
    
    // State Form
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [bloodType, setBloodType] = useState('A'); 
    const [nik, setNik] = useState('');
    const [phone, setPhone] = useState('');
    const [profilePic, setProfilePic] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // 1. Ambil Data Profil Saat Ini
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const db = getFirestore();
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFullName(data.fullName || '');
                    setGender(data.gender || '');
                    setAge(data.age || '');
                    setBloodType(data.bloodType || 'A'); 
                    setNik(data.nik || '');     
                    setPhone(data.phone || ''); 
                    setProfilePic(data.profilePic || null);
                }
            } catch (error) {
                console.error("Gagal ambil data user:", error);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchUserData();
    }, [user]);

    // 2. Pilih Foto
    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
            Alert.alert("Izin Ditolak", "Anda perlu mengizinkan akses galeri.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setProfilePic(result.assets[0].uri);
        }
    };

    // 3. Simpan Data
    const saveProfileData = async () => {
        if (!user) return;
        
        setLoading(true);

        try {
            let photoURL = profilePic;

            // Jika foto lokal (baru), upload dulu
            if (profilePic && !profilePic.startsWith('http')) {
                console.log("Mengupload foto profil baru...");
                photoURL = await uploadToCloudinary(profilePic);
            }

            const db = getFirestore();
            const userRef = doc(db, 'users', user.uid);
            
            // Update Firestore dengan NIK, No HP, dan Golongan Darah
            await updateDoc(userRef, {
                fullName,
                gender,
                age,
                bloodType, 
                nik,   
                phone, 
                profilePic: photoURL,
                updatedAt: new Date().toISOString()
            });

            Alert.alert('Berhasil', 'Profil Anda telah diperbarui!');
            navigation.goBack(); 

        } catch (error: any) {
            console.error("Gagal simpan profil:", error);
            Alert.alert('Gagal', 'Terjadi kesalahan: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                
                {/* Header */}
                <View className='flex-row justify-start items-center mt-4 mb-8'>
                    <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center">
                        <AntDesign name="left" size={24} color="#1F2937" />
                        <Text className='text-lg font-semibold text-gray-800 ml-2'>Kembali</Text>
                    </TouchableOpacity>
                </View>

                {/* Foto Profil */}
                <View className="items-center mb-8">
                    <TouchableOpacity onPress={pickImage} className="relative">
                        {profilePic ? (
                            <Image 
                                source={{ uri: profilePic }} 
                                className="w-32 h-32 rounded-full border-4 border-blue-100" 
                            />
                        ) : (
                            <View className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center border-4 border-gray-200">
                                <Ionicons name="camera" size={40} color="#9CA3AF" />
                            </View>
                        )}
                        <View className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white">
                            <Ionicons name="pencil" size={16} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text className="mt-3 text-blue-600 font-medium">Ubah Foto Profil</Text>
                </View>

                {/* Form Input */}
                <View className="space-y-4">

                    <View>
                        <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Nama Lengkap</Text>
                        <TextInput
                            className="border border-gray-300 rounded-2xl p-4 bg-gray-50 focus:border-blue-500 focus:bg-white"
                            placeholder="Nama Lengkap Anda"
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>
                    {/* Input NIK */}
                    <View>
                        <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">NIK (Nomor Induk Kependudukan)</Text>
                        <TextInput
                            className="border border-gray-300 rounded-2xl p-4 placeholder:text-gray-400 bg-gray-50 focus:border-blue-500 focus:bg-white"
                            placeholder="Masukkan 16 digit NIK "
                            keyboardType="numeric"
                            maxLength={16}
                            value={nik}
                            onChangeText={setNik}
                        />
                    </View>

                    {/* Input No. HP */}
                    <View>
                        <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">No. Handphone</Text>
                        <TextInput
                            className="border border-gray-300 rounded-2xl placeholder:text-gray-400 p-4 bg-gray-50 focus:border-blue-500 focus:bg-white"
                            placeholder="Contoh: 081234567890"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Jenis Kelamin</Text>
                        <TextInput
                            className="border border-gray-300 rounded-2xl placeholder:text-gray-400 p-4 bg-gray-50 focus:border-blue-500 focus:bg-white"
                            placeholder="Laki-laki / Perempuan"
                            value={gender}
                            onChangeText={setGender}
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Usia (Tahun)</Text>
                        <TextInput
                            className="border border-gray-300 rounded-2xl p-4 placeholder:text-gray-400 bg-gray-50 focus:border-blue-500 focus:bg-white"
                            placeholder="Contoh: 25"
                            keyboardType="numeric"
                            maxLength={3}
                            value={age}
                            onChangeText={setAge}
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Golongan Darah</Text>
                        <View className="border border-gray-300 rounded-2xl bg-gray-50 overflow-hidden justify-center">
                            <Picker
                                selectedValue={bloodType}
                                onValueChange={(itemValue: string) => setBloodType(itemValue)}
                                dropdownIconColor="#4B5563" 
                                style={{ 
                                    height: 55, 
                                    width: '100%', 
                                    color: bloodType === "" ? "#9CA3AF" : "#1F2937" 
                                }} 
                            >
                                {/* Item Placeholder */}
                                <Picker.Item label="Pilih Golongan Darah" value="" color="#9CA3AF" enabled={false} />
                                
                                {/* Item Pilihan (Warna Hitam) */}
                                <Picker.Item label="A" value="A" color="#000000" />
                                <Picker.Item label="B" value="B" color="#000000" />
                                <Picker.Item label="AB" value="AB" color="#000000" />
                                <Picker.Item label="O" value="O" color="#000000" />
                            </Picker>
                        </View>
                    </View>

                </View>

                {/* Tombol Simpan */}
                <TouchableOpacity
                    className={`w-full rounded-2xl py-4 items-center shadow-sm mt-10 ${
                        loading ? 'bg-blue-400' : 'bg-blue-600'
                    }`}
                    onPress={saveProfileData}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-lg font-bold">Simpan Perubahan</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}