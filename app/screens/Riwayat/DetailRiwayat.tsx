import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, ActivityIndicator, StyleSheet, Image, Dimensions } from "react-native";
import { useAuth } from "../../services/AuthContext";
import { db } from "../../services/firebaseConfig";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { useRoute } from "@react-navigation/native";
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

type DetectionBox = {
    bbox: [number, number, number, number];
    class: 'Immature' | 'Mature' | 'normal' | 'Nuclear';
    confidence: number;
    };
    type RiwayatItem = {
    id: string;
    prediction: 'Immature' | 'Mature' | 'normal' | 'Nuclear';
    confidence: number;
    eyeSide: 'left' | 'right';
    imageUrl: string;
    createdAt: Timestamp;
    detections: DetectionBox[];
    timestamp: string;
    };

    const { width } = Dimensions.get('window');
    const IMAGE_CONTAINER_WIDTH = width - 40; 
    const IMAGE_HEIGHT = IMAGE_CONTAINER_WIDTH; 

    const DetailRiwayat = () => {
    const { user } = useAuth();
    const route = useRoute();
    const { riwayatId } = route.params as { riwayatId: string };

    const [riwayat, setRiwayat] = useState<RiwayatItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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


    const formatTanggal = (timestamp: Timestamp) => {
        if (!timestamp) return "Tanggal tidak valid";
        return timestamp.toDate().toLocaleString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusInfo = (prediction: 'Immature' | 'Mature' | 'normal' | 'Nuclear') => {
        switch(prediction) {
            case 'normal':
                return {
                    text: "Mata Normal",
                    icon: "checkmark-circle",
                    textColor: '#065F46',
                    bgColor: '#ECFDF5',
                    borderColor: '#D1FAE5'
                };
            case 'Immature':
                return {
                    text: "Katarak Tahap Awal",
                    icon: "warning",
                    textColor: '#92400E',
                    bgColor: '#FFFBEB',
                    borderColor: '#FEF3C7'
                };
            case 'Mature':
                return {
                    text: "Katarak Tahap Lanjut",
                    icon: "alert-circle",
                    textColor: '#991B1B',
                    bgColor: '#FEF2F2',
                    borderColor: '#FEE2E2'
                };
            case 'Nuclear':
                return {
                    text: "Katarak Nuclear",
                    icon: "eyedrop",
                    textColor: '#581C87',
                    bgColor: '#FAF5FF',
                    borderColor: '#EDE9FE'
                };
            default:
                return {
                    text: prediction,
                    icon: "help-circle",
                    textColor: '#1F2937',
                    bgColor: '#F9FAFB',
                    borderColor: '#E5E7EB'
                };
        }
    };


const renderBoundingBoxes = () => {
    if (!riwayat || !riwayat.detections) return null;
    
    const getClassColor = (className: string) => {
        switch(className) {
            case 'normal': return '#10B981';    // Green
            case 'Immature': return '#F59E0B';  // Orange
            case 'Mature': return '#EF4444';    // Red
            case 'Nuclear': return '#8B5CF6';   // Purple
            default: return '#6B7280';          // Gray
        }
    };
    
    const getClassLabel = (className: string) => {
        switch(className) {
            case 'normal': return 'Normal';
            case 'Immature': return 'Katarak Awal';
            case 'Mature': return 'Katarak Lanjut';
            case 'Nuclear': return 'Katarak Nuclear';
            default: return className;
        }
    };
    
    return riwayat.detections.map((detection, index) => {
            const [cx, cy, w, h] = detection.bbox;
            const color = getClassColor(detection.class);
            const label = getClassLabel(detection.class);
            
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
                    {/* Bounding Box */}
                    <Rect 
                        x={x} 
                        y={y} 
                        width={width} 
                        height={height} 
                        stroke={color} 
                        strokeWidth={3} 
                        fill="transparent" 
                    />
                    
                    {/* Label Background */}
                    <Rect 
                        x={x} 
                        y={y - 22} 
                        width={Math.max(width, 100)} 
                        height={22} 
                        fill={color} 
                        rx={4}
                    />
                    
                    {/* Label Text */}
                    <SvgText 
                        x={x + 5} 
                        y={y - 7} 
                        fill="#FFFFFF" 
                        fontSize="11" 
                        fontWeight="bold"
                    >
                        {`${label} | ${confidenceText}`}
                    </SvgText>
                </React.Fragment>
            );
        });
    };

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

    const statusInfo = getStatusInfo(riwayat.prediction);

    return (
        <ScrollView className="flex-1 bg-blue-50">
        <View className="p-5">
            
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

{riwayat.detections && riwayat.detections.length > 0 && (
    <View className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-bold text-gray-800">
                Objek Terdeteksi
            </Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-700 text-xs font-bold">
                    {riwayat.detections.length} area
                </Text>
            </View>
        </View>
        
        {riwayat.detections.map((det, idx) => {
                const getDetectionColor = (className: string) => {
                    switch(className) {
                        case 'normal':
                            return { 
                                bg: '#ECFDF5',
                                text: '#065F46',
                                dotColor: '#10B981',
                                icon: '🟢',
                                label: 'Normal'
                            };
                        case 'Immature':
                            return { 
                                bg: '#FFFBEB',
                                text: '#92400E',
                                dotColor: '#F59E0B',
                                icon: '🟠',
                                label: 'Katarak Awal'
                            };
                        case 'Mature':
                            return { 
                                bg: '#FEF2F2',
                                text: '#991B1B',
                                dotColor: '#EF4444',
                                icon: '🔴',
                                label: 'Katarak Lanjut'
                            };
                        case 'Nuclear':
                            return { 
                                bg: '#FAF5FF',
                                text: '#581C87',
                                dotColor: '#8B5CF6',
                                icon: '🟣',
                                label: 'Katarak Nuclear'
                            };
                        default:
                            return { 
                                bg: '#F9FAFB',
                                text: '#1F2937',
                                dotColor: '#6B7280',
                                icon: '⚪',
                                label: className
                            };
                    }
                };
                
                const detColor = getDetectionColor(det.class);

                return (
                    <View 
                        key={idx} 
                        className={`flex-row items-center p-3 rounded-lg ${
                            idx < riwayat.detections.length - 1 ? 'mb-2' : ''
                        }`}
                        style={{ backgroundColor: detColor.bg }}
                    >
                        <View 
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: detColor.dotColor,
                                marginRight: 12
                            }}
                        />
                        
                        <View className="flex-1">
                            <View className="flex-row items-center">
                                <Text style={{ fontSize: 14, marginRight: 6 }}>
                                    {detColor.icon}
                                </Text>
                                <Text 
                                    className="font-semibold text-sm"
                                    style={{ color: detColor.text }}
                                >
                                    {detColor.label}
                                </Text>
                            </View>
                            <Text className="text-xs text-gray-500 mt-0.5">
                                Area #{idx + 1}
                            </Text>
                        </View>
                        
                        <View 
                            className="px-3 py-1.5 rounded-full"
                            style={{ 
                                backgroundColor: 'white',
                                borderWidth: 1.5,
                                borderColor: detColor.dotColor
                            }}
                        >
                            <Text 
                                className="font-bold text-xs"
                                style={{ color: detColor.text }}
                            >
                                {(det.confidence * 100).toFixed(0)}%
                            </Text>
                        </View>
                    </View>
                );
            })}
        </View>
    )}

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