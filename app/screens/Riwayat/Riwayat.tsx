import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../services/AuthContext";
import { db } from "../../services/firebaseConfig";
import { collection, query, onSnapshot, orderBy, Timestamp, deleteDoc, doc } from "firebase/firestore";

type RiwayatItem = {
    id: string;
    prediction: 'Immature' | 'Mature' | 'normal' | 'Nuclear';
    confidence: number;
    eyeSide: 'left' | 'right';
    imageUrl: string;
    createdAt: Timestamp;
    };

    const Riwayat = ({ navigation }: any) => {
    const { user } = useAuth();

    const [riwayatList, setRiwayatList] = useState<RiwayatItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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


    const handleDelete = (itemId: string) => {
        Alert.alert(
        "Hapus Riwayat",
        "Apakah Anda yakin ingin menghapus hasil deteksi ini? Tindakan ini tidak dapat dibatalkan.",
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
        if (!user) return;

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
        const mata = item.eyeSide === 'left' ? 'Mata Kiri' : 'Mata Kanan';
        
        switch(item.prediction) {
            case 'normal':
                return `${mata} - Normal`;
            case 'Immature':
                return `${mata} - Katarak Immature`;
            case 'Mature':
                return `${mata} - Katarak Mature`;
            case 'Nuclear':
                return `${mata} - Katarak Nuclear`;
            default:
                return `${mata} - ${item.prediction}`;
        }
    };

    const getStatusText = (prediction: 'Immature' | 'Mature' | 'normal' | 'Nuclear') => {
        switch(prediction) {
            case 'normal':
                return "Normal";
            case 'Immature':
                return "Katarak Awal";
            case 'Mature':
                return "Katarak Lanjut";
            case 'Nuclear':
                return "Katarak Nuclear";
            default:
                return prediction;
        }
    };

   const getStatusColor = (prediction: 'Immature' | 'Mature' | 'normal' | 'Nuclear') => {
        switch (prediction) {
            case 'normal':
                return "#10B981";  // Green
            case 'Immature':
                return "#F59E0B";  // Orange
            case 'Mature':
                return "#EF4444";  // Red
            case 'Nuclear':
                return "#8B5CF6";  // Purple
            default:
                return "#6B7280";  // Gray
        }
    };

    const renderItem = ({ item }: { item: RiwayatItem }) => {
        const title = getTitle(item);
        const statusText = getStatusText(item.prediction);
        const date = formatTanggal(item.createdAt);
        const statusColor = getStatusColor(item.prediction);

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate("DetailRiwayat", { riwayatId: item.id })}
                className="bg-white p-4 mb-4 rounded-xl shadow-sm"
            >
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 pr-2">
                        <Text className="text-base font-extrabold text-gray-800" numberOfLines={2}>
                            {title}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.statusTag,
                            { backgroundColor: statusColor }
                        ]}
                    >
                        <Text className="text-white text-xs font-bold">{statusText}</Text>
                    </View>
                    <Ionicons className="ml-2" name="chevron-forward" size={20} color="#6B7280" />
                </View>

                <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                        <Text className="ml-2 text-sm text-gray-500">{date}</Text>
                    </View>
                    
                    <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                            onPress={() => navigation.navigate("DetailRiwayat", { riwayatId: item.id })}
                            style={{ padding: 4 }}
                        >
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={() => handleDelete(item.id)}
                            style={{ padding: 4 }}
                        >
                            <Ionicons name="trash-bin-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };
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