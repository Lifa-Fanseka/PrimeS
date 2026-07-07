import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function StartupScreen() {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FFFFFF', 'rgba(6, 182, 212, 0.15)']}
      locations={[0, 0.6, 1]}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View>
          <Text style={styles.logo}>PRIME SCOUT</Text>

          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=1200&auto=format&fit=crop',
            }}
            style={styles.heroImage}
          />

          <Text style={styles.headline}>
            Your Talent Deserves Visibility
          </Text>

          <Text style={styles.bodyText}>
            Connect with scouts, coaches, and recruiters who are actively
            looking for athletes like you. Build your profile, showcase your
            skills, and get discovered by opportunities that match your
            potential.
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },

  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 24,
  },

  heroImage: {
    width: '100%',
    height: 192,
    borderRadius: 16,
    marginBottom: 24,
  },

  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 16,
  },

  bodyText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
    marginBottom: 32,
  },

  buttonsContainer: {
    gap: 12,
  },

  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 9999,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonPressed: {
    backgroundColor: '#0891B2',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonPressed: {
    backgroundColor: '#F9FAFB',
  },

  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});