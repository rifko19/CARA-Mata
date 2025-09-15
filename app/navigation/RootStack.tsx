import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Wawasan from "../screens/Wawasan";
import RootTabs from "./RootTabs";
import Deteksi from "../screens/Deteksi/Deteksi";
import Proses from "../screens/Deteksi/Proses";
import Hasil from "../screens/Deteksi/Hasil";

export type RootStackParamList = {
  Tabs: any;
  Wawasan: any;
  Deteksi: any;
  Proses: any;
  Hasil: any;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
    return (
        <Stack.Navigator
        initialRouteName="Tabs"
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
        >
        <Stack.Screen name="Tabs" component={RootTabs} />
        <Stack.Screen name="Wawasan" component={Wawasan}
          options={{
            headerTitleAlign: "center",
            headerShown: true,
            headerTitleStyle: { fontSize: 23, fontWeight: 'bold', color: '#2563EB' },
            animation: "fade_from_bottom"}}/>
        </Stack.Navigator>
    );
    }
