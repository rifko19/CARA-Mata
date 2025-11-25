import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Wawasan from "../screens/Wawasan/Wawasan";
import DetailArtikel from "../screens/Wawasan/DetailArtikel";


export type WawasanStackParamList = {
    Wawasan: any;
    DetailArtikel: any;
    };

    const Stack = createNativeStackNavigator<WawasanStackParamList>();

    export default function DeteksiStack() {
    return (
        <Stack.Navigator
        initialRouteName="Wawasan"
        screenOptions={{
            headerShown: true,
            animation: "slide_from_right",
        }}
        >
        <Stack.Screen name="Wawasan" component={Wawasan} options={{
            headerTitleAlign: "center",
            headerTitleStyle: { fontSize: 23, fontWeight: 'bold', color: '#2563EB' },
        }}/>
        <Stack.Screen name="DetailArtikel" component={DetailArtikel} options={{
            headerTitleAlign: "center",
            headerTitleStyle: { fontSize: 23, fontWeight: 'bold', color: '#2563EB' },
            title: 'Detail Artikel',
        }} />
        </Stack.Navigator>
    );
}