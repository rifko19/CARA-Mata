import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import RootStack from "./RootStack";

const theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: "transparent" },
    };

    export default function AppNavigator() {
    return (
        <NavigationContainer theme={theme}>
        <RootStack />
        </NavigationContainer>
    );
    }
