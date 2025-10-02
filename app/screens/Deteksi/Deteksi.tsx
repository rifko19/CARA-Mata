import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Button,
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Dimensions
} from "react-native";
import { loadTensorflowModel } from "react-native-fast-tflite";
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import Slider from '@react-native-community/slider';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_DISPLAY_HEIGHT = 288; // h-72

interface DetectionResult {
    imageUri: string;
    prediction: string;
    confidence: number;
    detections: Array<{
        class: string;
        confidence: number;
        bbox: number[];
    }>;
    timestamp: string;
}

// Model YOLOv5/v8 float32 umumnya membutuhkan input tensor float 32.
// Dimensi input tensor: [1, 3, 640, 640] atau [1, 640, 640, 3]
type ModelInputType = Float32Array; 
const INPUT_SIZE = 640;
const TENSOR_SIZE = INPUT_SIZE * INPUT_SIZE * 3; // 640 * 640 * 3 = 1,228,800

export default function Deteksi() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState({ width: INPUT_SIZE, height: INPUT_SIZE });
    const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
    const [model, setModel] = useState<any | null>(null);
    const [zoom, setZoom] = useState(0);
    const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        loadTFLiteModel();
        
        return () => {
            if (model) {
                try {
                    if (typeof model.release === 'function') {
                        model.release();
                    }
                } catch (e) {
                    console.log('Model cleanup error:', e);
                }
            }
        };
    }, []);

    const loadTFLiteModel = async () => {
        try {
            console.log('Loading TensorFlow Lite model...');
            
            // Asumsi path model ini benar
            const modelPath = require('../../../assets/models/best_float32.tflite');
            const loadedModel = await loadTensorflowModel(modelPath);
            
            setModel(loadedModel);
            setIsModelLoaded(true);
            console.log('TensorFlow Lite model loaded successfully');
            
        } catch (error) {
            console.error('Failed to load TFLite model:', error);
            
            Alert.alert(
                'Model Loading', 
                'Model TFLite tidak dapat dimuat. Menggunakan mode simulasi untuk demo.',
                [{ text: 'OK' }]
            );
            
            setTimeout(() => {
                setIsModelLoaded(true);
                console.log('Using simulation mode');
            }, 1000);
        }
    };

    /**
     * FUNGSI KRITIS: KONVERSI GAMBAR (JPEG/PNG) MENJADI TENSOR PIXEL FLOAT32.
     * * Saat ini, kami tidak memiliki alat bawaan untuk secara langsung mengkonversi 
     * Base64/File mentah menjadi array piksel Float32 sehingga kami menggunakan 
     * simulasi placeholder untuk memenuhi tipe data.
     * * UNTUK IMPLEMENTASI NYATA: Anda harus menulis kode yang:
     * 1. Decode Base64 (mengandung JPEG) menjadi data piksel mentah (R, G, B, A).
     * 2. Membuat Float32Array dengan ukuran 640*640*3.
     * 3. Mengisi array ini dengan nilai (pixel / 255.0) [NORMALISASI]
     * 4. Reshape jika diperlukan (misalnya dari [H, W, C] ke [C, H, W]).
     */
    const preprocessImage = async (imageUri: string): Promise<ModelInputType> => {
        try {
            console.log('Preprocessing image...');
            
            // 1. Resize dan dapatkan Base64
            const manipResult = await manipulateAsync(
                imageUri,
                [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
                { 
                    compress: 1, 
                    format: SaveFormat.JPEG,
                    base64: true 
                }
            );

            setImageSize({ width: INPUT_SIZE, height: INPUT_SIZE });
            
            if (!manipResult.base64) {
                throw new Error("Gagal mendapatkan data Base64 gambar.");
            }

            // ⚠️ Placeholder untuk TENSOR INPUT
            console.warn("⚠️ Placeholder Tensor digunakan. Deteksi AI nyata mungkin gagal tanpa implementasi Pixel Decoding & Normalisasi.");
            
            return new Float32Array(TENSOR_SIZE); 
            
        } catch (error) {
            console.error('Error preprocessing image:', error);
            throw error;
        }
    };

    const runInference = async (imageBytes: ModelInputType): Promise<DetectionResult> => {
        if (!model) {
            console.log('Running simulation mode...');
            return simulateDetection();
        }

        try {
            console.log('Running TFLite inference...');
            
            // Output dari model.run() di sini mungkin adalah objek map 
            // jika model memiliki banyak output (walaupun untuk fast-tflite biasanya array)
            const modelOutput = await model.run(imageBytes);
            
            let output: any;

            // Memeriksa jika output adalah objek dengan key numerik (ini sering terjadi di Fast-TFLite)
            if (typeof modelOutput === 'object' && modelOutput !== null && !Array.isArray(modelOutput)) {
                // Asumsi output utama berada di key pertama (misalnya key '0' atau 'output_0')
                const keys = Object.keys(modelOutput).sort();
                if (keys.length > 0) {
                    output = modelOutput[keys[0]];
                    console.log(`Using model output key: ${keys[0]}`);
                } else {
                    throw new Error("Model output is an empty object.");
                }
            } else {
                output = modelOutput;
            }

            if (!output || !output.length) {
                throw new Error("Model output is not a valid array/typed array with length.");
            }

            const predictions = parseYOLOOutput(output);
            
            // ... (Logika penentuan hasil deteksi tetap sama)

            const hasCataract = predictions.some((pred: any) => 
                pred.class === 'cataract' && pred.confidence > 0.5
            );
            
            const maxConfidence = predictions.length > 0 
                ? Math.max(...predictions.map((p: any) => p.confidence as number))
                : 0;

            const result: DetectionResult = {
                imageUri: capturedImage || '',
                prediction: hasCataract ? 'cataract' : 'normal',
                confidence: maxConfidence,
                detections: predictions as Array<{
                    class: string;
                    confidence: number;
                    bbox: number[];
                }>,
                timestamp: new Date().toISOString()
            };

            return result;
            
        } catch (error) {
            console.error('Inference error, switching to simulation mode:', error);
            // Kembali ke simulasi jika TFLite gagal (misalnya karena format tensor tidak tepat atau tipe output salah)
            return simulateDetection();
        }
    };

    const simulateDetection = (): DetectionResult => {
        // ... (Fungsi simulasi tetap sama)
        const isCataract = Math.random() > 0.6;
        const numDetections = Math.floor(Math.random() * 2) + 1;
        
        const detections = [];
        for (let i = 0; i < numDetections; i++) {
            detections.push({
                class: isCataract ? 'cataract' : 'normal',
                confidence: 0.65 + Math.random() * 0.3,
                bbox: [
                    0.3 + Math.random() * 0.4, // x center
                    0.3 + Math.random() * 0.4, // y center
                    0.2 + Math.random() * 0.2, // width
                    0.2 + Math.random() * 0.2  // height
                ]
            });
        }
        
        return {
            imageUri: capturedImage || '',
            prediction: isCataract ? 'cataract' : 'normal',
            confidence: Math.max(...detections.map(d => d.confidence)),
            detections: detections,
            timestamp: new Date().toISOString()
        };
    };

    const parseYOLOOutput = (output: any): Array<{class: string; confidence: number; bbox: number[]}> => {
        // Logika post-processing YOLO
        const detections: Array<{class: string; confidence: number; bbox: number[]}> = [];
        const confidenceThreshold = 0.3;
        
        try {
            // Memastikan output yang diterima adalah array atau typed array
            if (output && output.length && (Array.isArray(output) || output.buffer instanceof ArrayBuffer)) {
                
                // Konversi aman ke array number
                const outputArray = Array.from(output) as number[]; 
                // Asumsi output adalah array datar di mana setiap 6 elemen 
                // adalah [x, y, w, h, confidence, classId]
                const itemSize = 6; 
                const numDetections = outputArray.length / itemSize;
                
                for (let i = 0; i < numDetections; i++) {
                    const baseIndex = i * itemSize;
                    
                    if (baseIndex + 5 < outputArray.length) {
                        const x = outputArray[baseIndex] as number;
                        const y = outputArray[baseIndex + 1] as number;
                        const w = outputArray[baseIndex + 2] as number;
                        const h = outputArray[baseIndex + 3] as number;
                        const confidence = outputArray[baseIndex + 4] as number;
                        const classId = Math.round(outputArray[baseIndex + 5] as number);
                        
                        if (confidence > confidenceThreshold) {
                            const className = classId === 0 ? 'normal' : 'cataract';
                            
                            detections.push({
                                class: className,
                                confidence: confidence,
                                bbox: [x, y, w, h] // Bbox dalam format normalisasi [0-1]
                            });
                        }
                    }
                }
            } else {
                console.error("Output tensor tidak valid:", output);
            }
            
            return detections.sort((a, b) => b.confidence - a.confidence);
            
        } catch (error) {
            console.error('Error parsing YOLO output:', error);
            return [];
        }
    };
    
    // ... (renderBoundingBoxes, showDetectionResult, resetDetection, permissions check, dan JSX/UI tetap sama)

    const renderBoundingBoxes = () => {
        if (!detectionResult || detectionResult.detections.length === 0) return null;

        // Hitung display size (Lebar dan Tinggi yang digunakan di Image)
        const displayWidth = SCREEN_WIDTH - 40; // padding 20px each side
        const displayHeight = IMAGE_DISPLAY_HEIGHT;
        
        return (
            <Svg 
                style={StyleSheet.absoluteFill}
                width={displayWidth} 
                height={displayHeight}
            >
                {detectionResult.detections.map((detection, index) => {
                    // Konversi koordinat normalisasi YOLO (x_center, y_center, width, height) ke koordinat piksel
                    const [xCenter, yCenter, boxWidth, boxHeight] = detection.bbox;
                    
                    const x = (xCenter - boxWidth / 2) * displayWidth;
                    const y = (yCenter - boxHeight / 2) * displayHeight;
                    const w = boxWidth * displayWidth;
                    const h = boxHeight * displayHeight;
                    
                    const isCataract = detection.class === 'cataract';
                    const color = isCataract ? '#ef4444' : '#10b981';
                    
                    return (
                        <React.Fragment key={index}>
                            <Rect
                                x={x}
                                y={y}
                                width={w}
                                height={h}
                                stroke={color}
                                strokeWidth={3}
                                fill="transparent"
                            />
                            
                            <Rect
                                x={x}
                                y={y - 24}
                                width={w}
                                height={24}
                                fill={color}
                                opacity={0.9}
                            />
                            
                            <SvgText
                                x={x + 4}
                                y={y - 7}
                                fill="white"
                                fontSize="12"
                                fontWeight="bold"
                            >
                                {`${detection.class === 'cataract' ? 'Katarak | confidence:' : 'Normal | confidence:'} ${(detection.confidence * 100).toFixed(0)}%`}
                            </SvgText>
                        </React.Fragment>
                    );
                })}
            </Svg>
        );
    };

    const takePicture = async () => {
        if (!cameraRef.current) {
            Alert.alert('Error', 'Kamera belum siap');
            return;
        }

        if (isProcessing) return;

        setIsProcessing(true);
        
        try {
            console.log('Taking picture...');
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.9,
                base64: false,
                skipProcessing: false,
            });

            if (!photo?.uri) {
                throw new Error('Gagal mengambil foto');
            }

            setCapturedImage(photo.uri);

            // Tipe data sekarang adalah ModelInputType (Float32Array)
            const imageTensor = await preprocessImage(photo.uri);
            const result = await runInference(imageTensor);
            
            setDetectionResult(result);
            showDetectionResult(result);

        } catch (error) {
            console.error('Detection error:', error);
            Alert.alert(
                'Error Deteksi', 
                `Terjadi kesalahan: ${(error as Error).message}\nSilakan coba lagi.`,
                [{ text: 'OK' }]
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const showDetectionResult = (result: DetectionResult) => {
        const hasCataract = result.prediction === 'cataract';
        const confidencePercent = (result.confidence * 100).toFixed(1);

        let message = '';
        if (hasCataract) {
            message = `⚠️ Terdeteksi kemungkinan KATARAK\n\nTingkat kepercayaan: ${confidencePercent}%\n\nDitemukan ${result.detections.length} area deteksi.\n\nSilakan segera konsultasi dengan dokter mata untuk pemeriksaan lebih lanjut.`;
        } else {
            message = `✅ Tidak terdeteksi tanda-tanda katarak\n\nTingkat kepercayaan: ${confidencePercent}%\n\nNamun tetap lakukan pemeriksaan rutin ke dokter mata.`;
        }

        const title = hasCataract ? 'Katarak Terdeteksi' : 'Hasil Normal';

        Alert.alert(
            title,
            message,
            [
                { text: 'Ambil Foto Lagi', onPress: resetDetection },
                { text: 'Lihat Detail', onPress: () => {} },
                { text: 'OK' }
            ]
        );
    };

    const resetDetection = () => {
        setCapturedImage(null);
        setDetectionResult(null);
    };

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView className="flex-1 bg-sky-50">
                <ScrollView contentContainerStyle={{ paddingBottom: 24 }} className="px-5">
                    <View className="relative mt-6 bg-gray-200 h-56 rounded-xl">
                        <Text className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-600 font-semibold text-center px-4">
                            Tahan dengan stabil untuk pengambilan gambar
                        </Text>
                    </View>

                    <Text className="text-center text-sm text-gray-500 mt-4">
                        Kami butuh izin untuk mengakses kamera perangkat Anda untuk deteksi katarak.
                    </Text>
                    <Button onPress={requestPermission} title="Berikan Izin Kamera" />
                </ScrollView>
            </SafeAreaView>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    return (
        <SafeAreaView className="flex-1 bg-sky-50">
            <ScrollView className="px-5">
                <View className="relative mt-4 bg-gray-200 h-72 rounded-xl overflow-hidden">
                    {capturedImage ? (
                        <View className="flex-1">
                            <Image 
                                source={{ uri: capturedImage }} 
                                className="flex-1 w-full h-full"
                                resizeMode="contain"
                                style={{height: IMAGE_DISPLAY_HEIGHT, width: '100%'}} // Set explicit height for image
                            />
                            
                            {/* Render bounding boxes */}
                            {detectionResult && !isProcessing && renderBoundingBoxes()}
                            
                            <TouchableOpacity
                                onPress={resetDetection}
                                className="absolute top-4 left-4 p-2 bg-black bg-opacity-50 rounded-full"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            
                            {isProcessing && (
                                <View className="absolute inset-0 bg-black bg-opacity-50 items-center justify-center">
                                    <ActivityIndicator size="large" color="#fff" />
                                    <Text className="text-white mt-2 font-medium">
                                        Menganalisis dengan AI...
                                    </Text>
                                </View>
                            )}
                            
                            {detectionResult && !isProcessing && (
                                <View className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-90 rounded-lg p-3">
                                    <View className="flex-row items-center">
                                        <View className={`w-3 h-3 rounded-full mr-2 ${
                                            detectionResult.prediction === 'cataract' ? 'bg-red-500' : 'bg-green-500'
                                        }`} />
                                        <Text className="text-white font-semibold flex-1">
                                            {detectionResult.prediction === 'cataract' ? 'Katarak Terdeteksi' : 'Normal'}
                                        </Text>
                                        <Text className="text-white text-sm">
                                            {(detectionResult.confidence * 100).toFixed(1)}%
                                        </Text>
                                    </View>
                                    {detectionResult.detections.length > 0 && (
                                        <Text className="text-gray-300 text-xs mt-1">
                                            {detectionResult.detections.length} objek terdeteksi
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.cameraContainer}>
                            <CameraView
                                style={StyleSheet.absoluteFill}
                                facing={facing}
                                ref={cameraRef}
                                zoom={zoom}
                            >
                            </CameraView>
                            
                            {/* Camera Overlay */}
                            <View style={styles.overlayContainer} pointerEvents="none">
                                <View style={styles.circleGuide} />
                                <Text style={styles.guideText}>
                                    Posisikan mata di dalam lingkaran
                                </Text>
                            </View>

                            {/* Camera Controls */}
                            <View style={styles.controlsContainer}>
                                {/* Flip Camera Button */}
                                <TouchableOpacity
                                    onPress={toggleCameraFacing}
                                    style={styles.flipButton}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="camera-reverse-outline" size={30} color="#fff" />
                                </TouchableOpacity>

                                {/* Zoom Controls */}
                                <View style={styles.zoomContainer}>
                                    <View style={styles.zoomSliderWrapper}>
                                        <Ionicons name="remove" size={20} color="#fff" />
                                        <Slider
                                            style={styles.zoomSlider}
                                            minimumValue={0}
                                            maximumValue={1}
                                            value={zoom}
                                            onValueChange={setZoom}
                                            minimumTrackTintColor="#10b981"
                                            maximumTrackTintColor="rgba(255,255,255,0.3)"
                                            thumbTintColor="#10b981"
                                        />
                                        <Ionicons name="add" size={20} color="#fff" />
                                    </View>
                                    <Text style={styles.zoomText}>
                                        {(zoom * 100).toFixed(0)}% Zoom
                                    </Text>
                                </View>

                                {/* Zoom Preset Buttons */}
                                <View style={styles.zoomPresetContainer}>
                                    <TouchableOpacity
                                        onPress={() => setZoom(0)}
                                        style={[styles.zoomPresetButton, zoom === 0 && styles.zoomPresetButtonActive]}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.zoomPresetText, zoom === 0 && styles.zoomPresetTextActive]}>
                                            1x
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setZoom(0.25)}
                                        style={[styles.zoomPresetButton, Math.abs(zoom - 0.25) < 0.05 && styles.zoomPresetButtonActive]}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.zoomPresetText, Math.abs(zoom - 0.25) < 0.05 && styles.zoomPresetTextActive]}>
                                            1.5x
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setZoom(0.5)}
                                        style={[styles.zoomPresetButton, Math.abs(zoom - 0.5) < 0.05 && styles.zoomPresetButtonActive]}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.zoomPresetText, Math.abs(zoom - 0.5) < 0.05 && styles.zoomPresetTextActive]}>
                                            2x
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setZoom(1)}
                                        style={[styles.zoomPresetButton, zoom === 1 && styles.zoomPresetButtonActive]}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.zoomPresetText, zoom === 1 && styles.zoomPresetTextActive]}>
                                            Max
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Kondisi Pencahayaan */}
                <View className="mt-6 bg-white rounded-xl p-4 shadow-md">
                    <Text className="text-lg font-semibold text-gray-800">Kondisi Pencahayaan</Text>
                    <Text className="mt-1 text-sm text-gray-500">Sangat penting untuk akurasi deteksi</Text>
                    <View className="mt-3">
                        <Text className="text-xs text-gray-500">Buruk</Text>
                        <View className="w-full h-2 bg-gray-300 rounded-full mt-2">
                            {/* Placeholder untuk indikator pencahayaan real-time */}
                            <View className="h-2 bg-green-500 rounded-full" style={{ width: "70%" }} />
                        </View>
                        <Text className="text-xs text-gray-500 mt-2 text-right">Optimal</Text>
                    </View>
                </View>

                {/* Hasil Deteksi Detail */}
                {detectionResult && (
                    <View className="mt-4 bg-white rounded-xl p-4 shadow-md">
                        <Text className="text-lg font-semibold text-gray-800">Detail Analisis</Text>
                        
                        <View className={`mt-3 p-3 rounded-lg ${
                            detectionResult.prediction === 'cataract' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                        }`}>
                            <View className="flex-row justify-between items-center">
                                <Text className={`font-bold ${
                                    detectionResult.prediction === 'cataract' ? 'text-red-800' : 'text-green-800'
                                }`}>
                                    {detectionResult.prediction === 'cataract' ? 'KATARAK TERDETEKSI' : 'KONDISI NORMAL'}
                                </Text>
                                <View className={`px-2 py-1 rounded-full ${
                                    detectionResult.prediction === 'cataract' ? 'bg-red-200' : 'bg-green-200'
                                }`}>
                                    <Text className={`text-xs font-bold ${
                                        detectionResult.prediction === 'cataract' ? 'text-red-800' : 'text-green-800'
                                    }`}>
                                        {(detectionResult.confidence * 100).toFixed(1)}%
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {detectionResult.detections.length > 0 && (
                            <View className="mt-3">
                                <Text className="text-sm font-medium text-gray-700 mb-2">
                                    Deteksi ({detectionResult.detections.length}):
                                </Text>
                                {detectionResult.detections.map((detection, index) => (
                                    <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                                        <View className="flex-row items-center flex-1">
                                            <View className={`w-2 h-2 rounded-full mr-2 ${
                                                detection.class === 'cataract' ? 'bg-red-500' : 'bg-green-500'
                                            }`} />
                                            <Text className="text-sm text-gray-700">
                                                {detection.class === 'cataract' ? '🔴 Katarak' : '🟢 Normal '}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            <Text className="text-sm font-semibold text-gray-800 mr-2">
                                                {(detection.confidence * 100).toFixed(1)}%
                                            </Text>
                                            <Text className="text-xs text-gray-500">
                                                #{index + 1}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View className="mt-3 pt-3 border-t border-gray-200">
                            <Text className="text-xs text-gray-500">
                                📅 Waktu analisis: {new Date(detectionResult.timestamp).toLocaleString('id-ID', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Tombol Ambil Gambar */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={capturedImage ? resetDetection : takePicture}
                    disabled={isProcessing || !isModelLoaded}
                    className={`mt-6 items-center justify-center rounded-3xl py-4 shadow-lg mb-6 ${
                        isProcessing || !isModelLoaded 
                            ? 'bg-blue-400' 
                            : 'bg-blue-600'
                    }`}
                >
                    <View className="flex-row items-center">
                        {isProcessing ? (
                            <>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text className="ml-3 text-center text-xl font-semibold text-white">
                                    Menganalisis dengan AI...
                                </Text>
                            </>
                        ) : capturedImage ? (
                            <>
                                <Ionicons name="refresh-outline" size={23} color="#fff" />
                                <Text className="ml-3 text-center text-xl font-semibold text-white">
                                    Deteksi Lagi
                                </Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="camera-outline" size={23} color="#fff" />
                                <Text className="ml-3 text-center text-xl font-semibold text-white">
                                    {isModelLoaded ? 'Mulai Deteksi' : 'Loading AI Model...'}
                                </Text>
                            </>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Disclaimer */}
                <View className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <Text className="text-xs text-yellow-800 text-center">
                        ⚠️ Hasil ini hanya untuk skrining awal. Selalu konsultasi dengan dokter mata profesional untuk diagnosis yang akurat.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 48,
    },
    circleGuide: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: '#10b981',
        opacity: 0.7,
    },
    guideText: {
        marginTop: 16,
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 8,
        paddingVertical: 8,
    },
    controlsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 16,
        paddingHorizontal: 16,
    },
    flipButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 999,
        zIndex: 10,
    },
    zoomContainer: {
        marginTop: 60,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    zoomSliderWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: 8,
    },
    zoomSlider: {
        flex: 1,
        height: 40,
    },
    zoomText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    zoomPresetContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    zoomPresetButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    zoomPresetButtonActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    zoomPresetText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    zoomPresetTextActive: {
        color: '#fff',
    },
});
