import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Welcome from "../screens/Welcome";
import RootTabs from "./RootTabs";
import Wawasan from "../screens/Wawasan";
import Login from "../screens/Auth/Login";
import Sign from "../screens/Auth/Sign-Up"
import ProfileEdit from "../screens/ProfileEdit"; // Ganti 'app/screens/ProfileEdit' jika path berbeda
import { useAuth } from "../services/AuthContext"; // <-- Import useAuth

export type RootStackParamList = {
  Welcome: any;
  Tabs: any;
  Wawasan: any;
  Login: any;
  Sign: any;
  ProfileEdit: any;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  const { isAuthenticated, isGuest } = useAuth();
  const initialRouteName = (isAuthenticated || isGuest) ? "Tabs" : "Welcome";

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false, animation: "fade" }}
    >
      <Stack.Screen name="Welcome" component={Welcome}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="Tabs" component={RootTabs} />
      <Stack.Screen name="Wawasan" component={Wawasan}
        options={{
          headerTitleAlign: "center",
          headerShown: true,
          headerTitleStyle: { fontSize: 23, fontWeight: 'bold', color: '#2563EB' },
        }}
      />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Sign" component={Sign}/>
      <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
    </Stack.Navigator>
  );
}