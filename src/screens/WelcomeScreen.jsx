import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FFFFFF', 'rgba(6, 182, 212, 0.10)']}
      locations={[0, 0.65, 1]}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topSpace} />

        <View style={styles.centerContent}>
          <Text style={styles.logo}>PRIME SCOUT</Text>
          <Text style={styles.tagline}>
            Discover Talent. Build Futures.
          </Text>
        </View>

        <View style={styles.bottomContent}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.navigate('Startup')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },

  topSpace: {
    flex: 1,
  },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  logo: {
    fontSize: 50,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -1,
  },

  tagline: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '400',
    color: '#4B5563',
    textAlign: 'center',
  },

  button: {
    width: '100%',
    height: 56,
    borderRadius: 9999,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    backgroundColor: '#0891B2',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});