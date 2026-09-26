import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import WelcomeScreen from './src/screens/WelcomeScreen';
import StartupScreen from './src/screens/2StartupScreen';
import SignUpScreen from './src/screens/3SignUpScreen';
import LoginScreen from './src/screens/4LoginScreen';
import AthleteDashboard from './src/screens/AthleteDashboard';
import SearchScreen from './src/screens/SearchScreen';
import NetworkScreen from './src/screens/NetworkScreen';
import MessagesScreen from './src/screens/MessageScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/MeProfileScreen';
import PublicProfileScreen from './src/screens/PublicProfileScreen';
import JoinTeamScreen from './src/screens/JoinTeamScreen';
import MyTeamScreen from './src/screens/MyTeamScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ScoutDashboardScreen from './src/screens/ScoutDashboardScreen';
import CoachDashboardScreen from './src/screens/CoachDashboardScreen';
import ParentDashboard from './src/screens/ParentDashboard';
import LeagueAdminDashboard from './src/screens/LeagueAdminDashboard';
import ScoutFeedScreen from './src/screens/ScoutFeedScreen';
import OfferDetailScreen from './src/screens/OfferDetailScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Startup" component={StartupScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="AthleteDashboard" component={AthleteDashboard} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Network" component={NetworkScreen} />
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
          <Stack.Screen name="JoinTeam" component={JoinTeamScreen} />
          <Stack.Screen name="MyTeam" component={MyTeamScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ScoutDashboard" component={ScoutDashboardScreen} />
          <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
          <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
          <Stack.Screen name="LeagueAdminDashboard" component={LeagueAdminDashboard} />
          <Stack.Screen name="ScoutFeed" component={ScoutFeedScreen} />
          <Stack.Screen name="OfferDetail" component={OfferDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}