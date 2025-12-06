import { Ionicons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Button,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { loadTensorflowModel } from "react-native-fast-tflite";
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useAuth } from '../../services/AuthContext';
import { db } from '../../services/firebaseConfig';


const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_DISPLAY_HEIGHT = 288;

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
    eyeSide: 'left' | 'right';
}


type ModelInputType = Float32Array; 
const INPUT_SIZE = 640;
const TENSOR_SIZE = INPUT_SIZE * INPUT_SIZE * 3;

export default function Deteksi() {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState({ width: INPUT_SIZE, height: INPUT_SIZE });
    const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
    const [model, setModel] = useState<any | null>(null);
    const [selectedEye, setSelectedEye] = useState('left');
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
            
            const modelPath = require('../../../assets/models/best_float32_NEW.tflite');
            console.log('Model path resolved:', modelPath); 
            
            const loadedModel = await loadTensorflowModel(modelPath);
            
            setModel(loadedModel);
            setIsModelLoaded(true);
            console.log('✓ Model loaded successfully');
            
            if (loadedModel.inputs && loadedModel.outputs) {
                console.log('Model inputs:', loadedModel.inputs);
                console.log('Model outputs:', loadedModel.outputs);
            }
            
        } catch (error) {
            console.error('Failed to load TFLite model:', error);
            Alert.alert('Model Loading Error', 'Model tidak dapat dimuat.');
        }
    };


    const calculateIoU = (box1: number[], box2: number[]): number => {
        const [x1, y1, w1, h1] = box1;
        const [x2, y2, w2, h2] = box2;

        const left1 = x1 - w1/2, right1 = x1 + w1/2;
        const top1 = y1 - h1/2, bottom1 = y1 + h1/2;
        
        const left2 = x2 - w2/2, right2 = x2 + w2/2;
        const top2 = y2 - h2/2, bottom2 = y2 + h2/2;
        
        const intersectLeft = Math.max(left1, left2);
        const intersectTop = Math.max(top1, top2);
        const intersectRight = Math.min(right1, right2);
        const intersectBottom = Math.min(bottom1, bottom2);
        
        const intersectArea = Math.max(0, intersectRight - intersectLeft) * Math.max(0, intersectBottom - intersectTop);

        const area1 = w1 * h1;
        const area2 = w2 * h2;
        const unionArea = area1 + area2 - intersectArea;
        
        return intersectArea / (unionArea + 1e-6);
    };

const parseYOLOOutput = (output: any): Array<{class: string; confidence: number; bbox: number[]}> => {
    const detections: Array<{class: string; confidence: number; bbox: number[]}> = [];
    const confThreshold = 0.25;
    
    try {
        let outputArray: number[];
        
        if (output instanceof Float32Array || output instanceof Float64Array) {
            outputArray = Array.from(output);
        } else if (Array.isArray(output)) {
            outputArray = output;
        } else {
            console.error('❌ Invalid output type:', typeof output);
            return [];
        }
        
        console.log('Raw output length:', outputArray.length);
        console.log('First 20 values:', outputArray.slice(0, 20).map(v => v.toFixed(3)).join(', '));
        

        let numDetections = 0;
        let featuresPerBox = 6;
        
        if (outputArray.length === 1800) {
            numDetections = 300;
            console.log('✅ Format: (1, 300, 6) - NMS output');
        } else if (outputArray.length === 600) {
            numDetections = 100;
            console.log('✅ Format: (1, 100, 6) - NMS output');
        } else if (outputArray.length === 50400) {
            console.warn('⚠️ Format: (1, 6, 8400) - RAW output, using fallback');
            return parseYOLOOutputRaw(outputArray);
        } else {
            numDetections = Math.floor(outputArray.length / 6);
            console.log(`Auto-detected ${numDetections} predictions`);
        }
        
        console.log(`Processing ${numDetections} post-NMS detections...`);
        
        for (let i = 0; i < numDetections; i++) {
            const baseIdx = i * featuresPerBox;
            
            if (baseIdx + featuresPerBox > outputArray.length) {
                console.warn(`Index out of bounds at ${i}`);
                break;
            }
            
            const x1 = outputArray[baseIdx + 0] ?? 0;
            const y1 = outputArray[baseIdx + 1] ?? 0;
            const x2 = outputArray[baseIdx + 2] ?? 0;
            const y2 = outputArray[baseIdx + 3] ?? 0;
            const confidence = outputArray[baseIdx + 4] ?? 0;
            const classId = Math.round(outputArray[baseIdx + 5] ?? 0);
            
            if (confidence < confThreshold) continue;
            if (x1 === 0 && y1 === 0 && x2 === 0 && y2 === 0) continue;
            
            let norm_x1 = x1, norm_y1 = y1, norm_x2 = x2, norm_y2 = y2;
            
            if (x1 > 2 || x2 > 2 || y1 > 2 || y2 > 2) {
                norm_x1 = x1 / INPUT_SIZE;
                norm_y1 = y1 / INPUT_SIZE;
                norm_x2 = x2 / INPUT_SIZE;
                norm_y2 = y2 / INPUT_SIZE;
            }
            
            norm_x1 = Math.max(0, Math.min(1, norm_x1));
            norm_y1 = Math.max(0, Math.min(1, norm_y1));
            norm_x2 = Math.max(0, Math.min(1, norm_x2));
            norm_y2 = Math.max(0, Math.min(1, norm_y2));
            
            if (norm_x2 <= norm_x1 || norm_y2 <= norm_y1) continue;
            
            const cx = (norm_x1 + norm_x2) / 2;
            const cy = (norm_y1 + norm_y2) / 2;
            const w = norm_x2 - norm_x1;
            const h = norm_y2 - norm_y1;
            
            if (w < 0.01 || h < 0.01) continue;
            
            const classNames = ['Immature', 'Mature', 'Normal', 'Nuclear'];
            const className = classNames[classId] || 'unknown';
            
            detections.push({
                class: className,
                confidence: confidence,
                bbox: [cx, cy, w, h]
            });
        }
        
        console.log(`✅ Found ${detections.length} valid detections`);
        
        const sorted = detections.sort((a, b) => b.confidence - a.confidence);
        
        sorted.slice(0, 5).forEach((det, idx) => {
            console.log(`  ${idx + 1}. ${det.class} ${(det.confidence * 100).toFixed(1)}% at [${det.bbox.map(v => v.toFixed(2)).join(', ')}]`);
        });
        
        return sorted.slice(0, 20);
        
    } catch (error) {
        console.error('❌ Error parsing YOLO output:', error);
        return [];
    }
};

const parseYOLOOutputRaw = (outputArray: number[]): Array<{class: string; confidence: number; bbox: number[]}> => {
    console.log('⚠️ Using RAW parsing (backup mode)');
    
    const detections: Array<{class: string; confidence: number; bbox: number[]}> = [];
    const confThreshold = 0.25;
    const numPredictions = 8400;
    
    const featuresPerBox = 8;
    const classNames = ['Immature', 'Mature', 'Normal', 'Nuclear'];
    
    for (let i = 0; i < numPredictions; i++) {
        const baseIdx = i * featuresPerBox;
        
        if (baseIdx + featuresPerBox > outputArray.length) break;
        
        let cx = outputArray[baseIdx + 0];
        let cy = outputArray[baseIdx + 1];
        let w = outputArray[baseIdx + 2];
        let h = outputArray[baseIdx + 3];
        

        const classScores = [
            outputArray[baseIdx + 4], // Immature
            outputArray[baseIdx + 5], // Mature
            outputArray[baseIdx + 6], // Normal
            outputArray[baseIdx + 7]  // Nuclear
        ];
        
        const maxClassScore = Math.max(...classScores);
        const maxClassIdx = classScores.indexOf(maxClassScore);
        const className = classNames[maxClassIdx];
        
        if (maxClassScore < confThreshold) continue;
        
        if (cx > 2) {
            cx = cx / INPUT_SIZE;
            cy = cy / INPUT_SIZE;
            w = w / INPUT_SIZE;
            h = h / INPUT_SIZE;
        }

        if (cx < 0 || cx > 1 || cy < 0 || cy > 1) continue;
        if (w <= 0 || w > 1 || h <= 0 || h > 1) continue;
        if (w < 0.02 || h < 0.02) continue;
        
        detections.push({
            class: className,
            confidence: maxClassScore,
            bbox: [cx, cy, w, h]
        });
    }
    
    return detections.sort((a, b) => b.confidence - a.confidence).slice(0, 100);
};

const jpeg = require('jpeg-js');
const preprocessImage = async (imageUri: string): Promise<ModelInputType> => {
    try {
        console.log('Preprocessing image...');

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
            throw new Error("Failed to get base64 data");
        }

        const binaryString = atob(manipResult.base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const jpegData = jpeg.decode(bytes, { useTArray: true });
        console.log(`Decoded JPEG: ${jpegData.width}x${jpegData.height}`);

        const rgbData = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);

        let idx = 0;
        for (let h = 0; h < INPUT_SIZE; h++) {
            for (let w = 0; w < INPUT_SIZE; w++) {
                const pixelIdx = (h * INPUT_SIZE + w) * 4;

                rgbData[idx++] = jpegData.data[pixelIdx] / 255.0;
                rgbData[idx++] = jpegData.data[pixelIdx + 1] / 255.0;
                rgbData[idx++] = jpegData.data[pixelIdx + 2] / 255.0;
            }
        }

        console.log('Image preprocessed (HWC format)');
        console.log('Tensor size:', rgbData.length);
        console.log('First 10 values:', Array.from(rgbData.slice(0, 10)));
        
        return rgbData;
        
    } catch (error) {
        console.error('Error preprocessing image:', error);
        throw error;
    }
};


const runInference = async (
    imageBytes: ModelInputType, 
    currentEye: 'left' | 'right',
    photoUri: string
): Promise<DetectionResult> => {
    
    if (!model) throw new Error('Model belum dimuat');

    try {
        console.log('=== INFERENCE START ===');
        const outputs = await model.run([imageBytes]);
        
        if (!outputs || !Array.isArray(outputs) || outputs.length === 0) {
            throw new Error('Invalid model output: outputs is empty or not an array');
        }
        const outputArray = outputs[0];
        if (!outputArray) {
            throw new Error('Invalid model output: first output is null/undefined');
        }
        
        const predictions = parseYOLOOutput(outputArray); 
        
        const abnormalDets = predictions.filter(p => 
            (p.class === 'Immature' || p.class === 'Mature' || p.class === 'Nuclear') 
            && p.confidence > 0.25
        );
        
        const classCounts: {[key: string]: number} = {};
        const classMaxConf: {[key: string]: number} = {};
        
        predictions.forEach(p => {
            classCounts[p.class] = (classCounts[p.class] || 0) + 1;
            classMaxConf[p.class] = Math.max(classMaxConf[p.class] || 0, p.confidence);
        });
        
        console.log('📊 Class distribution:', classCounts);
        console.log('📈 Max confidence per class:', classMaxConf);
        
        let dominantClass = 'Normal';
        let maxCount = 0;
        
        Object.keys(classCounts).forEach(className => {
            if (classCounts[className] > maxCount) {
                maxCount = classCounts[className];
                dominantClass = className;
            }
        });
        
        const severityOrder = ['Mature', 'Nuclear', 'Immature', 'Normal'];
        
        if (abnormalDets.length > 0) {
            for (const severity of severityOrder) {
                if (classCounts[severity] && classCounts[severity] > 0) {
                    dominantClass = severity;
                    break;
                }
            }
        }

        const finalConfidence = classMaxConf[dominantClass] || 
            (predictions.length > 0 ? Math.max(...predictions.map(p => p.confidence)) : 0);
        
        const hasCataract = dominantClass !== 'Normal';
        const nmsPredictions = applyNMS(predictions, 0.3);
        const finalDetection = nmsPredictions.length > 0 ? [nmsPredictions[0]] : [];

        console.log(`✅ Result: ${dominantClass.toUpperCase()} (${(finalConfidence * 100).toFixed(1)}%)`);
        console.log(`   Detections: ${predictions.length} total, ${abnormalDets.length} abnormal`);
        console.log('=== INFERENCE END ===');

        return {
            imageUri: photoUri, 
            prediction: dominantClass,
            confidence: finalConfidence,
            detections: predictions.slice(0, 1),
            timestamp: new Date().toISOString(),
            eyeSide: currentEye
        };
        
    } catch (error) {
        console.error('❌ Inference error:', error);
        throw error;
    }
};

const applyNMS = (
    detections: Array<{class: string; confidence: number; bbox: number[]}>,
    iouThreshold: number = 0.3
): Array<{class: string; confidence: number; bbox: number[]}> => {
    
    if (detections.length === 0) return [];
    
    const byClass: {[key: string]: typeof detections} = {};
    detections.forEach(det => {
        if (!byClass[det.class]) byClass[det.class] = [];
        byClass[det.class].push(det);
    });
    
    const kept: typeof detections = [];
    
    Object.keys(byClass).forEach(className => {
        const classDetections = byClass[className];
        classDetections.sort((a, b) => b.confidence - a.confidence);
        
        const classKept: typeof detections = [];
        
        for (let i = 0; i < classDetections.length; i++) {
            let shouldKeep = true;
            
            for (const keptBox of classKept) {
                const iou = calculateIoU(classDetections[i].bbox, keptBox.bbox);
                if (iou > iouThreshold) {
                    shouldKeep = false;
                    break;
                }
            }
            
            if (shouldKeep) {
                classKept.push(classDetections[i]);
                if (classKept.length >= 3) break;
            }
        }
        
        kept.push(...classKept);
    });
    
    console.log(`NMS: ${detections.length} → ${kept.length} detections`);
    
    return kept.sort((a, b) => b.confidence - a.confidence);
};



    const renderBoundingBoxes = () => {
        if (!detectionResult || detectionResult.detections.length === 0) return null;

        const displayWidth = SCREEN_WIDTH - 40;
        const displayHeight = IMAGE_DISPLAY_HEIGHT;
        
        // PERUBAHAN 1: Define color mapping untuk 4 class
        const colorMap: {[key: string]: string} = {
            'Immature': '#f59e0b',  // Orange - Katarak tahap awal
            'Mature': '#ef4444',    // Red - Katarak lanjut
            'Normal': '#10b981',    // Green - Normal
            'Nuclear': '#8b5cf6'    // Purple - Katarak nuclear
        };
        
        // PERUBAHAN 2: Define emoji/icon untuk setiap class (opsional)
        const iconMap: {[key: string]: string} = {
            'Immature': '🟠',
            'Mature': '🔴',
            'Normal': '🟢',
            'Nuclear': '🟣'
        };
        
        return (
            <Svg 
                style={StyleSheet.absoluteFill}
                width={displayWidth} 
                height={displayHeight}
            >
                {detectionResult.detections.map((detection, index) => {
                    const [xCenter, yCenter, boxWidth, boxHeight] = detection.bbox;
                    
                    const x = (xCenter - boxWidth / 2) * displayWidth;
                    const y = (yCenter - boxHeight / 2) * displayHeight;
                    const w = boxWidth * displayWidth;
                    const h = boxHeight * displayHeight;
                    
                    // PERUBAHAN 3: Gunakan colorMap untuk mendapatkan warna
                    const color = colorMap[detection.class] || '#6b7280'; // default gray
                    
                    // PERUBAHAN 4: Format label dengan nama class yang lebih user-friendly
                    const labelMap: {[key: string]: string} = {
                        'Immature': 'Katarak Immature',
                        'Mature': 'Katarak Mature',
                        'Normal': 'Normal',
                        'Nuclear': 'Katarak Nuclear'
                    };
                    
                    const displayLabel = labelMap[detection.class] || detection.class;
                    const confidenceText = `${(detection.confidence * 100).toFixed(0)}%`;
                    
                    // PERUBAHAN 5: Hitung lebar label secara dinamis
                    const labelText = `${displayLabel} | ${confidenceText}`;
                    const estimatedLabelWidth = labelText.length * 7;
                    const labelWidth = Math.max(w, estimatedLabelWidth);
                    
                    return (
                        <React.Fragment key={index}>
                            {/* Bounding Box */}
                            <Rect
                                x={x}
                                y={y}
                                width={w}
                                height={h}
                                stroke={color}
                                strokeWidth={3}
                                fill="transparent"
                            />
                            
                            {/* Label Background */}
                            <Rect
                                x={x}
                                y={y - 26}
                                width={labelWidth}
                                height={26}
                                fill={color}
                                opacity={0.9}
                                rx={4} // rounded corners
                            />
                            
                            {/* Label Text */}
                            <SvgText
                                x={x + 6}
                                y={y - 8}
                                fill="white"
                                fontSize="13"
                                fontWeight="bold"
                            >
                                {labelText}
                            </SvgText>
                            
                            {/* BONUS: Badge untuk severity (opsional) */}
                            {detection.class !== 'Normal' && (
                                <Rect
                                    x={x + w - 8}
                                    y={y + 4}
                                    width={8}
                                    height={8}
                                    fill={color}
                                    opacity={0.8}
                                />
                            )}
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

            const imageTensor = await preprocessImage(photo.uri);
            
            const result = await runInference(
                imageTensor, 
                selectedEye as 'left' | 'right', 
                photo.uri
            );
            
            setDetectionResult(result);

        } catch (error) {
            console.error('Detection error:', error);
            let errorMessage = "Terjadi kesalahan.";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            Alert.alert('Error Deteksi', `${errorMessage}\nSilakan coba lagi.`);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const showDetectionResult = (result: DetectionResult) => {
        const hasCataract = result.prediction !== 'Normal';
        const confidencePercent = (result.confidence * 100).toFixed(1);
        
        let severity = '';
        if (result.prediction === 'Immature') {
            severity = 'Katarak Tahap Awal (Immature)';
        } else if (result.prediction === 'Mature') {
            severity = 'Katarak Tahap Lanjut (Mature)';
        } else if (result.prediction === 'Nuclear') {
            severity = 'Katarak Nuklir';
        } else {
            severity = 'Normal';
        }

        let message = '';
        if (hasCataract) {
            message = `⚠️ Terdeteksi: ${severity}\n\nTingkat kepercayaan: ${confidencePercent}%\n\nDitemukan ${result.detections.length} area deteksi.\n\nSilakan segera konsultasi dengan dokter mata.`;
        } else {
            message = `✅ Tidak terdeteksi tanda-tanda katarak\n\nTingkat kepercayaan: ${confidencePercent}%\n\nTetap lakukan pemeriksaan rutin.`;
        }

        Alert.alert(severity, message, [
            { text: 'Ambil Foto Lagi', onPress: resetDetection },
            { text: 'OK' }
        ]);
    };

    const resetDetection = () => {
        setCapturedImage(null);
        setDetectionResult(null);
    };
    
    // SIMPAN HASIL DETEKSI
    const handleSaveResult = async () => {
        if (!user) {
            Alert.alert("Error", "Anda harus login untuk menyimpan hasil.");
            return;
        }
        
        if (!detectionResult || !detectionResult.imageUri || detectionResult.imageUri === '') {
            Alert.alert("Error", "Tidak ada hasil gambar untuk disimpan.");
            return;
        }

        setIsSaving(true);

        const CLOUD_NAME = "deqqxqw6n";
        const UPLOAD_PRESET = "ml_default";
        const apiUploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    
        try {
            const base64Img = await FileSystem.readAsStringAsync(detectionResult.imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const dataUri = `data:image/jpeg;base64,${base64Img}`;
            
            const response = await fetch(apiUploadUrl, {
                method: 'POST',
                body: JSON.stringify({
                    file: dataUri,
                    upload_preset: UPLOAD_PRESET,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const responseData = await response.json();
            
            if (responseData.error) throw new Error(responseData.error.message);
            const imageUrl = responseData.secure_url;
    
            const { imageUri, ...dataToSave } = detectionResult;
            const finalData = {
                ...dataToSave,
                userId: user.uid,
                imageUrl: imageUrl,
                createdAt: serverTimestamp()
            };

            const historyCollectionRef = collection(db, "users", user.uid, "riwayatDeteksi");
            await addDoc(historyCollectionRef, finalData);
    
            Alert.alert("Berhasil", "Hasil deteksi tersimpan di Riwayat.");

        } catch (error) {
            console.error("Gagal Menyimpan:", error);
            
            let errorMessage = "Terjadi kesalahan yang tidak diketahui.";

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            Alert.alert("Gagal Menyimpan", errorMessage);
        // -------------------------

        } finally {
            setIsSaving(false);
        }
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
                
                {!capturedImage && (
                    <View className="mx-5 mt-6 mb-2">
                        <Text className="text-slate-500 text-base font-semibold text-center mb-2 ml-1 uppercase tracking-wider">
                            Pilih Mata yang Diperiksa
                        </Text>
                        <SegmentedControl
                            values={['Mata Kiri', 'Mata Kanan']}
                            selectedIndex={selectedEye === 'left' ? 0 : 1}
                            onChange={(event) => {
                                setSelectedEye(event.nativeEvent.selectedSegmentIndex === 0 ? 'left' : 'right');
                            }}
                            fontStyle={{fontWeight: '600', fontSize: 14}}
                            activeFontStyle={{color: 'white', fontWeight: 'bold'}}
                            tintColor="#2563EB"
                            backgroundColor="#E2E8F0"
                            style={{ height: 40 }}
                        />
                    </View>
                )}

                <View className="relative mt-4 bg-gray-200 h-72 rounded-xl overflow-hidden">
                    {capturedImage ? (
                        <View className="flex-1">
                            <Image 
                                source={{ uri: capturedImage }} 
                                className="flex-1 w-full h-full"
                                resizeMode="cover"
                                style={{height: IMAGE_DISPLAY_HEIGHT, width: '100%'}}
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
                            
                            <View style={styles.overlayContainer} pointerEvents="none">
                                <View style={styles.circleGuide} />
                                <Text style={styles.guideText}>
                                    Posisikan mata di dalam lingkaran
                                </Text>
                            </View>

                            <View style={styles.controlsContainer}>
                                <TouchableOpacity
                                    onPress={toggleCameraFacing}
                                    style={styles.flipButton}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="camera-reverse-outline" size={30} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {!capturedImage && (
                    <View className="mt-4">
                        {/* Zoom Slider */}
                        <View className="bg-white rounded-xl p-2 ">
                            <Text className="text-xs font-semibold text-gray-600 text-center">
                                {(zoom * 100).toFixed(0)}% Zoom
                            </Text>
                            <View className="flex-row items-center gap-2">
                                <Ionicons name="remove" size={20} color="#6b7280" />
                                <Slider
                                    style={{ flex: 1, height: 40 }}
                                    minimumValue={0}
                                    maximumValue={1}
                                    value={zoom}
                                    onValueChange={setZoom}
                                    minimumTrackTintColor="#0ea5e9"
                                    maximumTrackTintColor="#d1d5db"
                                    thumbTintColor="#0284c7"
                                />
                                <Ionicons name="add" size={20} color="#6b7280" />
                            </View>
                        </View>

                        {/* Tombol Preset Zoom */}
                        <View className="flex-row justify-center gap-4 mt-3 mx-4">
                            <TouchableOpacity
                                onPress={() => setZoom(0)}
                                className={`flex-1 h-12 rounded-full p-2 justify-center items-center shadow-sm ${
                                    zoom === 0 
                                    ? 'bg-blue-600' 
                                    : 'bg-white border border-gray-200'
                                }`}
                                activeOpacity={0.7}
                            >
                                <Text className={`font-bold ${
                                    zoom === 0 
                                    ? 'text-white' 
                                    : 'text-gray-700'
                                }`}>
                                    1x
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setZoom(0.25)}
                                className={`flex-1 h-12 rounded-full justify-center items-center shadow-sm ${
                                    Math.abs(zoom - 0.25) < 0.05 
                                    ? 'bg-blue-600' 
                                    : 'bg-white border border-gray-200'
                                }`}
                                activeOpacity={0.7}
                            >
                                <Text className={`font-bold ${
                                    Math.abs(zoom - 0.25) < 0.05 
                                    ? 'text-white' 
                                    : 'text-gray-700'
                                }`}>
                                    1.5x
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setZoom(0.5)}
                                className={`flex-1 h-12 rounded-full justify-center items-center shadow-sm ${
                                    Math.abs(zoom - 0.5) < 0.05 
                                    ? 'bg-blue-600' 
                                    : 'bg-white border border-gray-200'
                                }`}
                                activeOpacity={0.7}
                            >
                                <Text className={`font-bold ${
                                    Math.abs(zoom - 0.5) < 0.05 
                                    ? 'text-white' 
                                    : 'text-gray-700'
                                }`}>
                                    2x
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setZoom(1)}
                                className={`flex-1 h-12 rounded-full justify-center items-center shadow-sm ${
                                    zoom === 1 
                                    ? 'bg-blue-600' 
                                    : 'bg-white border border-gray-200'
                                }`}
                                activeOpacity={0.7}
                            >
                                <Text className={`font-bold ${
                                    zoom === 1 
                                    ? 'text-white' 
                                    : 'text-gray-700'
                                }`}>
                                    Max
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}


                {/* Hasil Deteksi Detail */}
                {detectionResult && (
                    <View className="mt-4 bg-white rounded-xl p-4 shadow-md">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-lg font-semibold text-gray-800">Detail Analisis</Text>
                            <View className="bg-blue-100 px-3 py-1 rounded-full">
                                <Text className="text-blue-700 text-xs font-bold">
                                    {detectionResult.eyeSide === 'left' ? 'Mata Kiri' : 'Mata Kanan'}
                                </Text>
                            </View>
                        </View>
                        
                        <View className={`p-3 rounded-lg mb-3 `}>
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="text-xs text-gray-600 mb-1">Hasil Diagnosis</Text>
                                    <Text className={`text-lg font-bold ${
                                        detectionResult.prediction === 'Normal' ? 'text-green-700' :
                                        detectionResult.prediction === 'Immature' ? 'text-orange-700' :
                                        detectionResult.prediction === 'Mature' ? 'text-red-700' :
                                        'text-purple-700'
                                    }`}>
                                        {detectionResult.prediction === 'Normal' ? 'Normal' :
                                        detectionResult.prediction === 'Immature' ? 'Katarak Immature' :
                                        detectionResult.prediction === 'Mature' ? 'Katarak Mature' :
                                        'Katarak Nuclear'}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-xs text-gray-600 mb-1">Confidence</Text>
                                    <Text className={`text-2xl font-bold ${
                                        detectionResult.prediction === 'Normal' ? 'text-green-600' :
                                        detectionResult.prediction === 'Immature' ? 'text-orange-600' :
                                        detectionResult.prediction === 'Mature' ? 'text-red-600' :
                                        'text-purple-600'
                                    }`}>
                                        {(detectionResult.confidence * 100).toFixed(1)}%
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {detectionResult.detections.length > 0 && (
                            <View className="mt-3">
                                <Text className="text-sm font-medium text-gray-700 mb-2">
                                    Deteksi ({detectionResult.detections.length} area):
                                </Text>
                                {detectionResult.detections.map((detection, index) => {
                                    const getClassColor = (className: string) => {
                                        switch(className) {
                                            case 'Normal': return 'bg-green-500';
                                            case 'Immature': return 'bg-orange-500';
                                            case 'Mature': return 'bg-red-500';
                                            case 'Nuclear': return 'bg-purple-500';
                                            default: return 'bg-gray-500';
                                        }
                                    };
                                    
                                    const getClassIcon = (className: string) => {
                                        switch(className) {
                                            case 'Normal': return '🟢';
                                            case 'Immature': return '🟠';
                                            case 'Mature': return '🔴';
                                            case 'Nuclear': return '🟣';
                                            default: return '⚪';
                                        }
                                    };
                                    
                                    const getClassLabel = (className: string) => {
                                        switch(className) {
                                            case 'Normal': return 'Normal';
                                            case 'Immature': return 'Katarak Immature';
                                            case 'Mature': return 'Katarak Mature';
                                            case 'Nuclear': return 'Katarak Nuclear';
                                            default: return className;
                                        }
                                    };
                                    
                                    return (
                                        <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                                            <View className="flex-row items-center flex-1">
                                                <View className={`w-2 h-2 rounded-full mr-2 ${getClassColor(detection.class)}`} />
                                                <Text className="text-sm text-gray-700">
                                                    {getClassIcon(detection.class)} {getClassLabel(detection.class)}
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
                                    );
                                })}
                            </View>
                        )}

                        {detectionResult.prediction !== 'Normal' && (
                            <View className="mt-3 p-3 bg-yellow-50  rounded-lg">
                                <View className="flex-row items-start">
                                    <Ionicons name="warning-outline" size={18} color="#d97706" style={{marginTop: 2}} />
                                    <View className="flex-1 ml-2">
                                        <Text className="text-xs font-semibold text-yellow-800 mb-1">
                                            Rekomendasi:
                                        </Text>
                                        <Text className="text-xs text-yellow-700">
                                            {detectionResult.prediction === 'Immature' 
                                                ? 'Katarak Immature terdeteksi. Segera konsultasi dengan dokter mata untuk monitoring.' :
                                            detectionResult.prediction === 'Mature'
                                                ? 'Katarak mature terdeteksi. SEGERA hubungi dokter mata untuk evaluasi dan penanganan.' :
                                                'Katarak nuclear terdeteksi. Konsultasi dengan dokter mata untuk pemeriksaan lebih lanjut.'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        
                        <View className="mt-3 pt-3 border-t flex-row items-center border-gray-200">
                            <Ionicons className="mt-2" name="calendar-outline" size={16} color="#9ca3af" />
                            <Text className="text-xs ml-2 mt-2 text-gray-500">
                                Waktu analisis: {new Date(detectionResult.timestamp).toLocaleString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </View>
                        
                        {user && (
                            <TouchableOpacity
                                onPress={handleSaveResult}
                                disabled={isSaving}
                                activeOpacity={0.8}
                                style={[styles.saveButtonBase, styles.saveButtonGreen]} 
                            >
                                {isSaving ? (
                                    <>
                                        <ActivityIndicator size="small" color="#FFFFFF" /> 
                                        <Text style={styles.saveButtonText}>Menyimpan...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="bookmark-outline" size={18} color="white" />
                                        <Text style={styles.saveButtonText}>Simpan ke Riwayat</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Tombol Ambil Gambar */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={capturedImage ? resetDetection : takePicture}
                    disabled={isProcessing || !isModelLoaded}
                    className={`mt-6 items-center justify-center rounded-3xl py-4 shadow-lg mb-6 ${
                        isProcessing || !isModelLoaded 
                            ? 'bg-blue-600' 
                            : 'bg-blue-600'
                    }`}
                >
                    <View className="flex-row items-centder">
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
                
                <View className="mb-6 bg-yellow-50 rounded-lg p-3">
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

    saveButtonBase: {
        marginTop: 16,
        width: '100%',
        borderRadius: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    saveButtonGreen: {
        backgroundColor: '#059669',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14, // text-sm
        marginLeft: 8, // ml-2
    },

    zoomContainer: {
        marginTop: 60,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 12,
        paddingVertical: 4, 
        paddingHorizontal: 12,
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
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 12, 
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    zoomPresetContainer: {
        flexDirection: 'column',
        alignItems: 'center', 
        marginTop: 16,
    },
    zoomPresetButtonsWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 25,
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    zoomPresetButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
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
        fontWeight: 'bold',
    },
});