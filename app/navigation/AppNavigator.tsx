import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import RootStack from "./RootStack"; // Import RootStack tanpa NavigationContainer di dalamnya

const theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: "transparent" },
};


export default function AppNavigator({ isAuthenticated }: { isAuthenticated: boolean }) {
    return (
        <NavigationContainer theme={theme}>
            <RootStack isAuthenticated={isAuthenticated} />
        </NavigationContainer>
    );
}
