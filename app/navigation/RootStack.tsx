import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RootTabs from "./RootTabs";
import Wawasan from "../screens/Wawasan";

export type RootStackParamList = {
  Tabs: undefined;
  Wawasan: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
    return (
        <Stack.Navigator
        initialRouteName="Tabs"
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
        >
        <Stack.Screen name="Tabs" component={RootTabs} />
        <Stack.Screen name="Wawasan" component={Wawasan} />
        </Stack.Navigator>
    );
    }
