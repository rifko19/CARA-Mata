import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screens/Auth/Login";
import Sign from "../screens/Auth/Sign-Up";
import ProfileEdit from "../screens/ProfileEdit";
import Wawasan from "../screens/Wawasan/Wawasan";
import Welcome from "../screens/Welcome";
import { useAuth } from "../services/AuthContext";
import RootTabs from "./RootTabs";
import WawasanStack from "./WawasanStack";

export type RootStackParamList = {
  Welcome: any;
  Tabs: any;
  Wawasan: any;
  Login: any;
  Sign: any;
  ProfileEdit: any;
  WawasanStack: any;
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
      <Stack.Screen name="WawasanStack" component={WawasanStack}
        options={{
          headerTitleAlign: "center",
          headerShown: false,
          headerTitleStyle: { fontSize: 23, fontWeight: 'bold', color: '#2563EB' },
        }}
      />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Sign" component={Sign}/>
      <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
    </Stack.Navigator>
  );
}