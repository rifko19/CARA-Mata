import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, ActivityIndicator, StyleSheet, Image, Dimensions } from "react-native";
import { useAuth } from "../../services/AuthContext"; // Sesuaikan path
import { db } from "../../services/firebaseConfig"; // Sesuaikan path
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { useRoute } from "@react-navigation/native";
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

// Tipe data (tetap sama)
type DetectionBox = {
    bbox: [number, number, number, number];
    class: 'cataract' | 'normal';
    confidence: number;
    };
    type RiwayatItem = {
    id: string;
    prediction: 'cataract' | 'normal';
    confidence: number;
    eyeSide: 'left' | 'right';
    imageUrl: string;
    createdAt: Timestamp;
    detections: DetectionBox[];
    timestamp: string;
    };

    // Kalkulasi layout (tetap sama)
    const { width } = Dimensions.get('window');
    const IMAGE_CONTAINER_WIDTH = width - 40; 
    const IMAGE_HEIGHT = IMAGE_CONTAINER_WIDTH; 

    const DetailRiwayat = () => {
    const { user } = useAuth();
    const route = useRoute();
    const { riwayatId } = route.params as { riwayatId: string };

    // State (tetap sama)
    const [riwayat, setRiwayat] = useState<RiwayatItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // useEffect (logika fetch data tetap sama)
    useEffect(() => {
        if (!user || !riwayatId) {
        setError("Data tidak valid atau Anda tidak login.");
        setIsLoading(false);
        return;
        }
        const fetchDetail = async () => {
        setIsLoading(true);
        try {
            const docRef = doc(db, "users", user.uid, "riwayatDeteksi", riwayatId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
            setRiwayat({ id: docSnap.id, ...docSnap.data() } as RiwayatItem);
            } else {
            setError("Dokumen riwayat tidak ditemukan.");
            }
        } catch (err) {
            console.error("Error fetching detail:", err);
            setError("Gagal mengambil data dari database.");
        } finally {
            setIsLoading(false);
        }
        };
        fetchDetail();
    }, [user, riwayatId]);


    // --- Helper Functions (tetap sama) ---
    const formatTanggal = (timestamp: Timestamp) => {
        if (!timestamp) return "Tanggal tidak valid";
        return timestamp.toDate().toLocaleString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
        });
    };

    // --- 👇 FUNGSI INI DIPERBAIKI (MENGGUNAKAN HEX CODE) 👇 ---
    const getStatusInfo = (prediction: 'cataract' | 'normal') => {
        if (prediction === 'cataract') {
        return {
            text: "Katarak Terdeteksi",
            textColor: '#991B1B', // Hex untuk text-red-900
            bgColor: '#FEF2F2',   // Hex untuk bg-red-50
            borderColor: '#FEE2E2' // Hex untuk border-red-200
        };
        }
        return {
        text: "Mata Normal",
        textColor: '#065F46', // Hex untuk text-emerald-900
        bgColor: '#ECFDF5',   // Hex untuk bg-emerald-50
        borderColor: '#D1FAE5' // Hex untuk border-emerald-200
        };
    };


    const renderBoundingBoxes = () => {
        if (!riwayat || !riwayat.detections) return null;
        return riwayat.detections.map((detection, index) => {
        const [cx, cy, w, h] = detection.bbox;
        const color = detection.class === 'cataract' ? '#FF0000' : '#10B981';
        const x = (cx - w / 2) * IMAGE_CONTAINER_WIDTH;
        const y = (cy - h / 2) * IMAGE_HEIGHT;
        const width = w * IMAGE_CONTAINER_WIDTH;
        const height = h * IMAGE_HEIGHT;
        const confidenceText = `${(detection.confidence * 100).toFixed(0)}%`;
        if (x < 0 || y < 0 || (x + width) > IMAGE_CONTAINER_WIDTH || (y + height) > IMAGE_HEIGHT) {
            return null;
        }
        return (
            <React.Fragment key={index}>
            <Rect x={x} y={y} width={width} height={height} stroke={color} strokeWidth={2.5} fill="transparent" />
            <Rect x={x} y={y - 18} width={width} height={18} fill={color} />
            <SvgText x={x + 5} y={y - 5} fill="#FFFFFF" fontSize="10" fontWeight="bold">
                {`${detection.class === 'cataract' ? 'Katarak' : 'Normal'} | ${confidenceText}`}
            </SvgText>
            </React.Fragment>
        );
        });
    };

    // --- Tampilan Loading / Error (tetap sama) ---
    if (isLoading) {
        return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="mt-3 text-gray-600">Memuat detail riwayat...</Text>
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
    if (!riwayat) {
        return (
        <View style={styles.centerContainer}>
            <Text className="text-gray-600">Data tidak ditemukan.</Text>
        </View>
        );
    }

    // --- Tampilan Utama Halaman Detail ---
    
    // Panggil fungsi yang sudah diperbaiki
    const statusInfo = getStatusInfo(riwayat.prediction);

    return (
        <ScrollView className="flex-1 bg-blue-50">
        <View className="p-5">
            
            {/* 1. KARTU GAMBAR (Kode Image sudah diperbaiki sebelumnya) */}
            <View 
            className="bg-slate-900 rounded-2xl shadow-sm overflow-hidden"
            style={{ width: IMAGE_CONTAINER_WIDTH, height: IMAGE_HEIGHT }} 
            >
            <Image
                source={{ uri: riwayat.imageUrl }}
                style={StyleSheet.absoluteFill} 
                resizeMode="cover"
            />
            <Svg style={StyleSheet.absoluteFill}>
                {renderBoundingBoxes()}
            </Svg>
            </View>

            <View 
            className={`mt-4 p-4 rounded-xl border`}
            style={{
                backgroundColor: statusInfo.bgColor,
                borderColor: statusInfo.borderColor,
                borderWidth: 1 
            }}
            >
            <Text 
                className={`text-xs font-bold uppercase tracking-wider mb-1`}
                style={{ color: statusInfo.textColor }} // <-- Terapkan warna teks
            >
                Kondisi
            </Text>
            <Text 
                className={`text-2xl font-extrabold`}
                style={{ color: statusInfo.textColor }} // <-- Terapkan warna teks
            >
                {statusInfo.text}
            </Text>
            </View>

            <View className="mt-4 bg-white rounded-2xl p-4 shadow-sm ">
            <Text className="text-base font-bold text-gray-800 mb-4">
                Detail Informasi
            </Text>
            <View style={styles.infoRow}>
                <MaterialCommunityIcons name="brain" size={20} color="#6B7280" />
                <Text style={styles.infoKey}>Keyakinan AI</Text>
                <Text style={styles.infoValue}>
                {(riwayat.confidence * 100).toFixed(1)}%
                </Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons name="eye-outline" size={20} color="#6B7280" />
                <Text style={styles.infoKey}>Mata Diperiksa</Text>
                <Text style={styles.infoValue}>
                {riwayat.eyeSide === 'left' ? 'Kiri (OS)' : 'Kanan (OD)'}
                </Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text style={styles.infoKey}>Waktu Deteksi</Text>
                <Text style={styles.infoValue}>
                {formatTanggal(riwayat.createdAt)}
                </Text>
            </View>
            </View>

            {/* --- 👇 4. KARTU DETAIL DETEKSI (PERBAIKAN WARNA) 👇 --- */}
            {riwayat.detections && riwayat.detections.length > 0 && (
            <View className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-base font-bold text-gray-800 mb-3">
                Objek Terdeteksi ({riwayat.detections.length})
                </Text>
                
                {riwayat.detections.map((det, idx) => {
                // Dapatkan info warna dinamis
                const detColor = det.class === 'cataract' 
                    ? { bg: '#FEF2F2', text: '#991B1B' } // Warna Merah
                    : { bg: '#ECFDF5', text: '#065F46' }; // Warna Hijau

                return (
                    <View 
                    key={idx} 
                    className={`flex-row justify-between items-center p-3 rounded-lg ${
                        idx < riwayat.detections.length - 1 ? 'mb-2' : ''
                    }`}
                    style={{ backgroundColor: detColor.bg }} // <-- Terapkan warna BG
                    >
                    <Text 
                        className={`font-semibold`}
                        style={{ color: detColor.text }} // <-- Terapkan warna Teks
                    >
                        {idx + 1}. {det.class === 'cataract' ? 'Katarak' : 'Normal'}
                    </Text>
                    <Text 
                        className={`font-bold text-sm`}
                        style={{ color: detColor.text }} // <-- Terapkan warna Teks
                    >
                        {(det.confidence * 100).toFixed(0)}%
                    </Text>
                    </View>
                );
                })}
            </View>
            )}
            {/* --- 👆 KARTU DETAIL DETEKSI (PERBAIKAN WARNA) 👆 --- */}

        </View>
        </ScrollView>
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
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    infoKey: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#334155'
    },
    infoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0F172A'
    }
    });

    export default DetailRiwayat;