import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
// --- TAMBAHKAN 'Alert' ---
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../services/AuthContext";
import { db } from "../../services/firebaseConfig";
// --- TAMBAHKAN 'deleteDoc' dan 'doc' ---
import { collection, query, onSnapshot, orderBy, Timestamp, deleteDoc, doc } from "firebase/firestore";

// Tipe data (tetap sama)
type RiwayatItem = {
    id: string;
    prediction: 'cataract' | 'normal';
    confidence: number;
    eyeSide: 'left' | 'right';
    imageUrl: string;
    createdAt: Timestamp;
    };

    const Riwayat = ({ navigation }: any) => {
    const { user } = useAuth();

    // State (tetap sama)
    const [riwayatList, setRiwayatList] = useState<RiwayatItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // useEffect (tetap sama)
    useEffect(() => {
        if (!user) {
        setIsLoading(false);
        setError("Silakan login untuk melihat riwayat Anda.");
        return;
        }
        setIsLoading(true);
        const historyCollectionRef = collection(db, "users", user.uid, "riwayatDeteksi");
        const q = query(historyCollectionRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
        const data: RiwayatItem[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as RiwayatItem));
        setRiwayatList(data);
        setIsLoading(false);
        setError(null);
        }, (err) => {
        console.error("Error fetching history: ", err);
        setError("Gagal memuat riwayat deteksi.");
        setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);


    // --- FUNGSI BARU UNTUK HAPUS RIWAYAT ---

    // Langkah 1: Tampilkan Konfirmasi (Alert)
    const handleDelete = (itemId: string) => {
        Alert.alert(
        "Hapus Riwayat", // Judul
        "Apakah Anda yakin ingin menghapus hasil deteksi ini? Tindakan ini tidak dapat dibatalkan.", // Pesan
        [
            {
            text: "Batal",
            style: "cancel"
            },
            {
            text: "Hapus",
            style: "destructive",
            onPress: () => proceedWithDelete(itemId)
            }
        ]
        );
    };

    const proceedWithDelete = async (itemId: string) => {
        if (!user) return; // Pengecekan keamanan

        try {
        const docRef = doc(db, "users", user.uid, "riwayatDeteksi", itemId);
        
        await deleteDoc(docRef);
        console.log("Riwayat berhasil dihapus:", itemId);

        } catch (err) {
        console.error("Error deleting document: ", err);
        Alert.alert("Error", "Gagal menghapus riwayat. Silakan coba lagi.");
        }
    };


    const formatTanggal = (timestamp: Timestamp) => {
        if (!timestamp) return "Tanggal tidak valid";
        return timestamp.toDate().toLocaleString('id-ID', {
        day: 'numeric', month: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
        });
    };

    const getTitle = (item: RiwayatItem) => {
        const mata = item.eyeSide === 'left' ? '(Mata Kiri)' : '(Mata Kanan)';
        if (item.prediction === 'cataract') {
        return `Katarak Terdeteksi ${mata}`;
        }
        return `Mata Normal ${mata}`;
    };

    const getStatusText = (prediction: 'cataract' | 'normal') => {
        return prediction === 'cataract' ? "Terdeteksi" : "Tidak Ada";
    };

    const getStatusColor = (status: "Terdeteksi" | "Tidak Ada") => {
        switch (status) {
        case "Terdeteksi": return "#FF0000";
        case "Tidak Ada": return "#10B981";
        default: return "#7D7D7D";
        }
    };

    // --- Render Item untuk FlatList (DISESUAIKAN) ---

    const renderItem = ({ item }: { item: RiwayatItem }) => {
        const title = getTitle(item);
        const status = getStatusText(item.prediction);
        const date = formatTanggal(item.createdAt);

        return (
        <TouchableOpacity
            onPress={() => navigation.navigate("DetailRiwayat", { riwayatId: item.id })}
            className="bg-white p-4 mb-4 rounded-xl shadow-sm"
        >
            <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1 pr-2">
                <Text className="text-base font-extrabold text-gray-700" numberOfLines={2}>
                {title}
                </Text>
            </View>
            <View className="flex-row items-center">
                <View
                style={[
                    styles.statusTag,
                    { backgroundColor: getStatusColor(status) }
                ]}
                >
                <Text className="text-white text-xs font-bold">{status}</Text>
                </View>
                <Ionicons className="ml-2" name="chevron-forward" size={20} color="#6B7280" />
            </View>
            </View>
            <View className="flex-row justify-between items-center mt-1">
            <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                <Text className="ml-2 text-sm text-gray-400">{date}</Text>
            </View>
            <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={{ padding: 4 }} 
            >
                <Ionicons name="trash-bin-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
            </View>
        </TouchableOpacity>
        );
    };

    // --- Tampilan Loading / Error / Kosong (tetap sama) ---
    if (isLoading) {
        return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="mt-3 text-gray-600">Memuat riwayat...</Text>
        </View>
        );
    }
    if (error) {
        return (
        <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="mt-3 text-red-600 text-center px-10">{error}</Text>
        </View>
        );
    }
    if (!isLoading && riwayatList.length === 0) {
        return (
        <View style={styles.centerContainer}>
            <Ionicons name="document-text-outline" size={48} color="#6B7280" />
            <Text className="mt-3 text-gray-600">Belum ada riwayat deteksi.</Text>
        </View>
        );
    }

    // Tampilan Utama (FlatList)
    return (
        <View className="flex-1 bg-blue-50 px-5 py-6">
        <FlatList
            data={riwayatList}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
        />
        </View>
    );
    };

    // StyleSheet (tetap sama)
    const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F9FF'
    },
    statusTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    }
    });

    export default Riwayat;