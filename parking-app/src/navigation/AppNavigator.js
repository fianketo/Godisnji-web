import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";

const Tab = createBottomTabNavigator();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: "#0b1626", card: "#12213a" },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#1f6feb",
          tabBarInactiveTintColor: "#6b7d9c",
          tabBarStyle: { backgroundColor: "#12213a", borderTopColor: "#1f345a" },
        }}
      >
        <Tab.Screen name="Parkiranje" component={HomeScreen} />
        <Tab.Screen name="Istorija" component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
