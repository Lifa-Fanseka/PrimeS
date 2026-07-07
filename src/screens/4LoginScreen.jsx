import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const dummyUsers = [
  {
    email: 'athlete@primescout.com',
    password: '123456',
    role: 'Athlete',
    name: 'Demo Athlete',
  },
  {
    email: 'scout@primescout.com',
    password: '123456',
    role: 'Scout',
    name: 'Demo Scout',
  },
  {
    email: 'coach@primescout.com',
    password: '123456',
    role: 'Coach',
    name: 'Demo Coach',
  },
  {
    email: 'parent@primescout.com',
    password: '123456',
    role: 'Parent',
    name: 'Demo Parent',
  },
];

export default function LoginScreen() {
  const navigation = useNavigation();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.email.trim() || !form.email.includes('@')) {
      newErrors.email = 'Valid email is required';
    }

    if (!form.password.trim() || form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (!validateForm()) return;

    const user = dummyUsers.find(
      (u) =>
        u.email.toLowerCase() === form.email.toLowerCase().trim() &&
        u.password === form.password
    );

    if (!user) {
      Alert.alert('Login Failed', 'Incorrect email or password');
      return;
    }

   if (user.role === 'Athlete') {
  navigation.navigate('AthleteDashboard', { user });
} else if (user.role === 'Scout') {
  navigation.navigate('ScoutDashboard', { user });
} else if (user.role === 'Coach') {
  navigation.navigate('CoachDashboard', { user });
} else if (user.role === 'Parent') {
  navigation.navigate('ParentDashboard', { user });
}

    // Later we will replace these with real dashboard screens
    // Example:
    // if (user.role === 'Athlete') navigation.navigate('AthleteDashboard', { user });
    // if (user.role === 'Scout') navigation.navigate('ScoutDashboard', { user });
    // if (user.role === 'Coach') navigation.navigate('CoachDashboard', { user });
    // if (user.role === 'Parent') navigation.navigate('ParentDashboard', { user });
  };

  const renderInput = (
    label,
    field,
    placeholder,
    keyboardType = 'default',
    secureTextEntry = false
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          focusedField === field && styles.inputFocused,
          errors[field] && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={form[field]}
        onChangeText={(text) => updateField(field, text)}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        onFocus={() => setFocusedField(field)}
        onBlur={() => setFocusedField('')}
      />

      {errors[field] ? (
        <Text style={styles.errorText}>{errors[field]}</Text>
      ) : null}
    </View>
  );

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FFFFFF', 'rgba(6, 182, 212, 0.15)']}
      locations={[0, 0.6, 1]}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.logo}>PRIME SCOUT</Text>

        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
          }}
          style={styles.heroImage}
        />

        <Text style={styles.heading}>Welcome Back</Text>
        <Text style={styles.subHeading}>
          Log in to continue building your future
        </Text>

        {renderInput(
          'Email',
          'email',
          'your.email@example.com',
          'email-address'
        )}

        {renderInput(
          'Password',
          'password',
          'Enter your password',
          'default',
          true
        )}

        <View style={styles.optionsRow}>
          <Pressable
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View
              style={[
                styles.checkbox,
                rememberMe && styles.checkboxChecked,
              ]}
            >
              {rememberMe && <Feather name="check" size={12} color="#FFFFFF" />}
            </View>

            <Text style={styles.rememberText}>Remember me</Text>
          </Pressable>

          <Pressable onPress={() => Alert.alert('Forgot Password', 'Coming soon')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.loginButtonPressed,
          ]}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </Pressable>

        <View style={styles.signUpRow}>
          <Text style={styles.signUpText}>Don't have an account? </Text>

          <Pressable onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
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
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },

  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 24,
  },

  heroImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 24,
  },

  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
  },

  subHeading: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    marginBottom: 24,
  },

  fieldGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },

  input: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#000000',
  },

  inputFocused: {
    borderColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  inputError: {
    borderColor: '#EF4444',
  },

  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
  },

  optionsRow: {
    marginTop: -4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  checkboxChecked: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },

  rememberText: {
    fontSize: 14,
    color: '#4B5563',
  },

  forgotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#06B6D4',
  },

  loginButton: {
    width: '100%',
    height: 56,
    borderRadius: 9999,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  loginButtonPressed: {
    backgroundColor: '#0891B2',
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  signUpText: {
    fontSize: 15,
    color: '#4B5563',
  },

  signUpLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#06B6D4',
  },

  demoBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  demoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },

  demoText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
  },
});