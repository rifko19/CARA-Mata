import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Riwayat from "../screens/Riwayat/Riwayat";
import DetailRiwayat from "../screens/Riwayat/DetailRiwayat";


export type RiwayatStackParamList = {
    Riwayat: any;
    DetailRiwayat: any;
    };

    const Stack = createNativeStackNavigator<RiwayatStackParamList>();

    export default function DeteksiStack() {
    return (
        <Stack.Navigator
        initialRouteName="Riwayat"
        screenOptions={{
            headerShown: true,
            animation: "slide_from_right",
        }}
        >
        <Stack.Screen name="Riwayat" component={Riwayat} options={{
            headerTitleAlign: "center",
            headerTitleStyle: { fontSize: 23, fontWeight: 'bold', color: '#2563EB' },
            title: 'Daftar Riwayat',
        }}/>
        <Stack.Screen name="DetailRiwayat" component={DetailRiwayat} options={{
            headerTitleAlign: "center",
            headerTitleStyle: { fontSize: 23, fontWeight: 'bold', color: '#2563EB' },
            title: 'Detail Hasil',
        }} />
        </Stack.Navigator>
    );
    }