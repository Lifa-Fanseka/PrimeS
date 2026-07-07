import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './src/screens/WelcomeScreen';
import StartupScreen from './src/screens/2StartupScreen';
import SignUpScreen from './src/screens/3SignUpScreen';
import LoginScreen from './src/screens/4LoginScreen';
import AthleteDashboard from './src/screens/AthleteDashboard';
import SearchScreen from './src/screens/SearchScreen';
import MessagesScreen from './src/screens/MessageScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import MeProfileScreen from './src/screens/MeProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ScoutDashboardScreen from './src/screens/ScoutDashboardScreen';
import CoachDashboardScreen from './src/screens/CoachDashboardScreen';
import ParentDashboard from './src/screens/ParentDashboard';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Startup" component={StartupScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AthleteDashboard" component={AthleteDashboard} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="MeProfile" component={MeProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ScoutDashboard" component={ScoutDashboardScreen} />
        <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
        <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
      
      </Stack.Navigator>
    </NavigationContainer>
  );
}