import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Deteksi from "../screens/Deteksi/Deteksi";
import Persiapan from "../screens/Deteksi/Persiapan";
import Proses from "../screens/Deteksi/Proses";
import Hasil from "../screens/Deteksi/Hasil";

export type DeteksiStackParamList = {
    Persiapan: any;
    Deteksi: any;
    Proses: any;
    Hasil: any;
    };

    const Stack = createNativeStackNavigator<DeteksiStackParamList>();

    export default function DeteksiStack() {
    return (
        <Stack.Navigator
        initialRouteName="Persiapan"
        screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
        }}
        >
        <Stack.Screen name="Persiapan" component={Persiapan} />
        <Stack.Screen name="Deteksi" component={Deteksi} />
        <Stack.Screen name="Proses" component={Proses} />
        <Stack.Screen name="Hasil" component={Hasil} />
        </Stack.Navigator>
    );
    }