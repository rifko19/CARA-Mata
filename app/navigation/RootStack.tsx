import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Welcome from "../screens/Welcome";
import RootTabs from "./RootTabs";
import Wawasan from "../screens/Wawasan";
import Login from "../screens/Auth/Login";
import Sign from "../screens/Auth/Sign-Up"

export type RootStackParamList = {
  Welcome: any;
  Tabs: any;
  Wawasan: any;
  Login: any;
  Sign: any;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false, animation: "fade" }}
    >
      <Stack.Screen name="Welcome" component={Welcome}
        options={{
          headerShown: false,
        }}
      />
      {/* <Stack.Screen name="Welcome" component={Login}
        options={{
          headerShown: false,
        }}
      /> */}
      {/* RootTabs Screen (Halaman utama setelah Welcome) */}
      <Stack.Screen name="Tabs" component={RootTabs} />
      
      {/* Wawasan Screen */}
      <Stack.Screen name="Wawasan" component={Wawasan}
        options={{
          headerTitleAlign: "center",
          headerShown: true,
          headerTitleStyle: { fontSize: 23, fontWeight: 'bold', color: '#2563EB' },
        }}
      />
      <Stack.Screen name="Login" component={Login}
        // options={{
        //   animation:
        // }}
      />
      <Stack.Screen name="Sign" component={Sign}/>
    </Stack.Navigator>
  );
}
