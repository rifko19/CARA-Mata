import { Ionicons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider';
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
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
}


type ModelInputType = Float32Array; 
const INPUT_SIZE = 640;
const TENSOR_SIZE = INPUT_SIZE * INPUT_SIZE * 3;

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
            
            const modelPath = require('../../../assets/models/best_float32.tflite');
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
        
        const intersectArea = Math.max(0, intersectRight - intersectLeft) * 
                            Math.max(0, intersectBottom - intersectTop);

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
            
            const className = classId === 0 ? 'cataract' : 'normal';
            
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
    const featuresPerBox = 6;
    
    for (let i = 0; i < numPredictions; i++) {
        const baseIdx = i * featuresPerBox;
        
        if (baseIdx + featuresPerBox > outputArray.length) break;
        
        let cx = outputArray[baseIdx + 0];
        let cy = outputArray[baseIdx + 1];
        let w = outputArray[baseIdx + 2];
        let h = outputArray[baseIdx + 3];
        const objectness = outputArray[baseIdx + 4];
        const classScore = outputArray[baseIdx + 5];
        
        if (objectness < confThreshold) continue;
        
        if (cx > 2) {
            cx = cx / INPUT_SIZE;
            cy = cy / INPUT_SIZE;
            w = w / INPUT_SIZE;
            h = h / INPUT_SIZE;
        }
        
        if (cx < 0 || cx > 1 || cy < 0 || cy > 1) continue;
        if (w <= 0 || w > 1 || h <= 0 || h > 1) continue;
        if (w < 0.02 || h < 0.02) continue;
        
        const isCataract = classScore > 0.5;
        const className = isCataract ? 'cataract' : 'normal';
        const classConfidence = isCataract ? classScore : (1 - classScore);
        const finalConfidence = objectness * classConfidence;
        
        if (finalConfidence >= confThreshold) {
            detections.push({
                class: className,
                confidence: finalConfidence,
                bbox: [cx, cy, w, h]
            });
        }
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

                rgbData[idx++] = jpegData.data[pixelIdx] / 255.0;     // R
                rgbData[idx++] = jpegData.data[pixelIdx + 1] / 255.0; // G
                rgbData[idx++] = jpegData.data[pixelIdx + 2] / 255.0; // B
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


const runInference = async (imageBytes: ModelInputType): Promise<DetectionResult> => {
    if (!model) {
        throw new Error('Model belum dimuat');
    }

    try {
        console.log('=== INFERENCE START ===');
        console.log('Input tensor size:', imageBytes.length);
        
        const outputs = await model.run([imageBytes]);
        
        if (!outputs || !Array.isArray(outputs) || outputs.length === 0) {
            throw new Error('Invalid model output: outputs is empty or not an array');
        }
        
        const outputArray = outputs[0];
        
        if (!outputArray) {
            throw new Error('Invalid model output: first output is null/undefined');
        }
        
        console.log('Output type:', outputArray.constructor.name);
        console.log('Output length:', outputArray.length);
        console.log('Expected: 1800 (300×6) or 600 (100×6) for NMS=true');
        
        const predictions = parseYOLOOutput(outputArray);
        
        if (predictions.length === 0) {
            console.warn('⚠️ No detections found!');
        } else {
            console.log(`✅ Final: ${predictions.length} detections`);
        }
        
        const cataractDets = predictions.filter(p => 
            p.class === 'cataract' && p.confidence > 0.25
        );
        
        const hasCataract = cataractDets.length > 0;
        const maxConfidence = predictions.length > 0 
            ? Math.max(...predictions.map(p => p.confidence))
            : 0;

        console.log(`✅ Result: ${hasCataract ? 'CATARACT' : 'NORMAL'} (${(maxConfidence * 100).toFixed(1)}%)`);
        console.log('=== INFERENCE END ===');

        return {
            imageUri: capturedImage || '',
            prediction: hasCataract ? 'cataract' : 'normal',
            confidence: maxConfidence,
            detections: predictions.slice(0, 10),
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Inference error:', error);
        throw error;
    }
};

const applyNMS = (
    detections: Array<{class: string; confidence: number; bbox: number[]}>,
    iouThreshold: number = 0.4
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
                            ? 'bg-blue-600' 
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