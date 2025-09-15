import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View } from 'react-native';

import Beranda from "../screens/Beranda";
import Klinik from "../screens/Klinik";
import Profile from "../screens/Profile";
import Riwayat from "../screens/Riwayat";
import DeteksiStack from "./DeteksiStack";

export type RootTabParamList = {
    Beranda: any;
    Riwayat: any;
    DeteksiStack: any;
    Klinik: any;
    Profil: any;
    Wawasan: any;
    };

    const Tab = createBottomTabNavigator<RootTabParamList>();

    export default function RootTabs() {
    return (
        <Tab.Navigator
        initialRouteName="Beranda"
        screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#2563EB",
            tabBarInactiveTintColor: "#6B7280",
        }}
        >
        <Tab.Screen
            name="Beranda"
            component={Beranda}
            options={{
            title: "Beranda",
            tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" color={color} size={size} />
            ),
            }}
        />
        <Tab.Screen
            name="Riwayat"
            component={Riwayat}
            options={{
            headerTitleAlign: "center",
            headerTitleStyle: { fontSize: 23, fontWeight: 'bold', color: '#2563EB' },
            headerShown: true,
            title: "Riwayat",
            tabBarActiveTintColor: "#F59E0B",
            tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="history" color={color} size={size} />
            ),
            }}
        />
        <Tab.Screen
            name="DeteksiStack" // Gunakan nama stack navigator di sini
            component={DeteksiStack}
            options={{
            headerShown: false,
            title: "Pemindaian", // Judul tab
            tabBarIcon: ({ color, size }) => (
                <View
                style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: '#2563EB',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 30,
                }}
                >
                <Ionicons name="camera-outline" color="white" size={25} />
                </View>
            ),
            }}
        />
        <Tab.Screen
            name="Klinik"
            component={Klinik}
            options={{
            headerTitleAlign: "center",
            headerTitleStyle: { fontSize: 23, fontWeight: 'bold', color: '#2563EB' },
            headerShown: true,
            title: "Klinik",
            tabBarActiveTintColor: "#6B21A8",
            tabBarIcon: ({ color, size }) => (
                <Ionicons name="medkit-outline" color={color} size={size} />
            ),
            }}
        />
        <Tab.Screen
            name="Profil"
            component={Profile}
            options={{
            title: "Profil",
            tabBarActiveTintColor: "#10B981",
            tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" color={color} size={size} />
            ),
            }}
        />
        </Tab.Navigator>
    );
    }