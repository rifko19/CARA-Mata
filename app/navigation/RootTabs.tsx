// app/navigation/RootTabs.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View } from 'react-native';

import Beranda from "../screens/Beranda";
import Deteksi from "../screens/Deteksi";
import Klinik from "../screens/Klinik";
import Profile from "../screens/Profile";
import Riwayat from "../screens/Riwayat";

export type RootTabParamList = {
    Beranda: undefined;
    Riwayat: undefined;
    Deteksi: undefined;
    Klinik: undefined;
    Profil: undefined;
    Wawasan: undefined;
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
                tabBarIcon: ({ color, size }) => (
                    <MaterialIcons name="history" color={color} size={size} />
            ),
            }}
        />
        <Tab.Screen
            name="Deteksi"
            component={Deteksi}
            options={{
                headerShown: true,
                headerTitleAlign: "center",
                headerTitleStyle: { fontSize: 23, fontWeight: 'bold', color: '#2563EB' },
                title: "Pemindaian Mata",
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
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="person-outline" color={color} size={size} />
                ),
                }}
        />

        </Tab.Navigator>
    );
    }
