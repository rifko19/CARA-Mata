import {
    CameraMode,
    CameraType,
    CameraView,
    useCameraPermissions,
    } from "expo-camera";
    import { useRef, useState } from "react";
    import { Button, Pressable, StyleSheet, Text, View, Image, Alert } from "react-native";
    import AntDesign from "@expo/vector-icons/AntDesign";
    import Feather from "@expo/vector-icons/Feather";
    import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
    import axios from "axios"; // Untuk mengirim gambar ke API Roboflow

    export default function App() {
    const [permission, requestPermission] = useCameraPermissions();
    const ref = useRef<CameraView>(null);
    const [uri, setUri] = useState<string | null>(null);
    const [mode, setMode] = useState<CameraMode>("picture");
    const [facing, setFacing] = useState<CameraType>("back");
    const [recording, setRecording] = useState(false);
    const [predictions, setPredictions] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    if (!permission) {
        return null;
    }

    if (!permission.granted) {
        return (
        <View style={styles.container}>
            <Text style={{ textAlign: "center" }}>
            We need your permission to use the camera
            </Text>
            <Button onPress={requestPermission} title="Grant permission" />
        </View>
        );
    }

    // Fungsi untuk mengambil gambar dan mengirim ke API Roboflow
    const takePicture = async () => {
        const photo = await ref.current?.takePictureAsync();
        if (photo?.uri) {
        setUri(photo.uri);
        sendToRoboflow(photo.uri);
        }
    };

    // Fungsi untuk mengirim gambar ke API Roboflow dan mendapatkan hasil deteksi
    const sendToRoboflow = async (uri: string) => {
  setLoading(true); // Mulai loading
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append("image", blob, "image.jpg");

    const roboflowResponse = await axios.post(
        "https://serverless.roboflow.com/cataract-lt8ek/2",
        formData,
        {
            headers: {
            "Content-Type": "multipart/form-data",
            },
            params: {
            api_key: "Lrpwni9G7ReyNWL7mPEb",
            },
            timeout: 15000,
        }
        );

        console.log("API Response:", roboflowResponse.data);

        if (roboflowResponse.data && roboflowResponse.data.predictions) {
        setPredictions(roboflowResponse.data.predictions);
        } else {
        throw new Error("No predictions received from the API");
        }
    } catch (error) {
        console.error("Error sending image to Roboflow:", error);

        if (axios.isAxiosError(error)) {
        if (error.response) {
            Alert.alert("Error API", `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            Alert.alert("Error Jaringan", "Tidak ada respons dari server. Periksa koneksi internet Anda.");
        } else {
            Alert.alert("Error", `Permintaan error: ${error.message}`);
        }
        } else if (error instanceof Error) {
        Alert.alert("Error", `Terjadi kesalahan saat mengirim gambar: ${error.message}`);
        } else {
        Alert.alert("Error", "Terjadi kesalahan tidak dikenal saat mengirim gambar.");
        }
    } finally {
        setLoading(false); // Hentikan loading
    }
    };


    // Fungsi untuk merekam video
    const recordVideo = async () => {
        if (recording) {
        setRecording(false);
        ref.current?.stopRecording();
        return;
        }
        setRecording(true);
        const video = await ref.current?.recordAsync();
        console.log({ video });
    };

    // Fungsi untuk toggle antara mode foto dan video
    const toggleMode = () => {
        setMode((prev) => (prev === "picture" ? "video" : "picture"));
    };

    // Fungsi untuk toggle antara kamera depan dan belakang
    const toggleFacing = () => {
        setFacing((prev) => (prev === "back" ? "front" : "back"));
    };

    const renderPicture = (uri: string) => {
        return (
        <View>
            <Image
            source={{ uri }}
            style={{ width: 300, aspectRatio: 1 }}
            />
            <Button onPress={() => setUri(null)} title="Take another picture" />
        </View>
        );
    };

    const renderCamera = () => {
        return (
        <View style={styles.cameraContainer}>
            <CameraView
            style={styles.camera}
            ref={ref}
            mode={mode}
            facing={facing}
            mute={false}
            responsiveOrientationWhenOrientationLocked
            />
            <View style={styles.shutterContainer}>
            <Pressable onPress={toggleMode}>
                {mode === "picture" ? (
                <AntDesign name="picture" size={32} color="white" />
                ) : (
                <Feather name="video" size={32} color="white" />
                )}
            </Pressable>
            <Pressable onPress={mode === "picture" ? takePicture : recordVideo}>
                {({ pressed }) => (
                <View
                    style={[
                    styles.shutterBtn,
                    {
                        opacity: pressed ? 0.5 : 1,
                    },
                    ]}
                >
                    <View
                    style={[
                        styles.shutterBtnInner,
                        {
                        backgroundColor: mode === "picture" ? "white" : "red",
                        },
                    ]}
                    />
                </View>
                )}
            </Pressable>
            <Pressable onPress={toggleFacing}>
                <FontAwesome6 name="rotate-left" size={32} color="white" />
            </Pressable>
            </View>
        </View>
        );
    };

    return (
        <View style={styles.container}>
        {uri ? renderPicture(uri) : renderCamera()}

        {/* Menampilkan hasil deteksi */}
        {predictions && (
            <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Predictions:</Text>
            {predictions.map((prediction: any, index: number) => (
                <Text key={index}>
                {prediction.class}: {Math.round(prediction.confidence * 100)}%
                </Text>
            ))}
            </View>
        )}
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    cameraContainer: StyleSheet.absoluteFillObject,
    camera: StyleSheet.absoluteFillObject,
    shutterContainer: {
        position: "absolute",
        bottom: 44,
        left: 0,
        width: "100%",
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 30,
    },
    shutterBtn: {
        backgroundColor: "transparent",
        borderWidth: 5,
        borderColor: "white",
        width: 85,
        height: 85,
        borderRadius: 45,
        alignItems: "center",
        justifyContent: "center",
    },
    shutterBtnInner: {
        width: 70,
        height: 70,
        borderRadius: 50,
    },
    });
