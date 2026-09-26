import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../api/auth';

const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill the email if it was remembered from a previous login.
  useEffect(() => {
    AsyncStorage.getItem(REMEMBERED_EMAIL_KEY).then((savedEmail) => {
      if (savedEmail) {
        setForm((prev) => ({ ...prev, email: savedEmail }));
        setRememberMe(true);
      }
    });
  }, []);

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

  const dashboardByRole = {
    Athlete: 'AthleteDashboard',
    Scout: 'ScoutDashboard',
    Coach: 'CoachDashboard',
    Parent: 'ParentDashboard',
    LeagueAdmin: 'LeagueAdminDashboard',
  };

  // Small spinner on the button while credentials are being checked —
  // the form stays visible and interactive, so a wrong-password error
  // just shows right back on the same screen rather than being masked
  // by a full-screen takeover. The bigger, full-screen Lottie animation
  // is reserved for the dashboard's own initial load right after —
  // that's already wired up on the destination screen itself, so once
  // navigation.reset() fires here, the handoff into that animation
  // happens automatically without anything further needed in this file.
  const handleLogin = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const result = await login(form.email.trim(), form.password);

      // Remember (or forget) the email based on the checkbox, after a
      // successful login — never remember on a failed attempt.
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, form.email.trim());
      } else {
        await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      const targetScreen = dashboardByRole[result.role] ?? 'Startup';
      navigation.reset({
        index: 0,
        routes: [{ name: targetScreen }],
      });
    } catch (err) {

      console.log('LOGIN ERROR:', JSON.stringify({
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        code: err?.code,
      }, null, 2));
      
      const status = err?.response?.status;
      if (status === 401) {
        Alert.alert('Login Failed', 'Incorrect email or password.');
      } else if (status === 403) {
        Alert.alert('Account Locked', err?.response?.data ?? 'Your account is not active yet.');
      } else {
        Alert.alert('Login Failed', 'Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
    // Deliberately not resetting submitting in a `finally` here — on
    // success, we navigate away entirely, so there's no screen left to
    // un-spin the button on; only the error path needs to restore it.
  };

  const renderInput = (
    label,
    field,
    placeholder,
    keyboardType = 'default'
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
    <View style={styles.screen}>
      {/* Gradient fills the entire screen, including behind the notch/status bar */}
      <LinearGradient
        colors={['#FFFFFF', '#FFFFFF', 'rgba(6, 182, 212, 0.15)']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    focusedField === 'password' && styles.inputFocused,
                    errors.password && styles.inputError,
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={form.password}
                  onChangeText={(text) => updateField('password', text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                />
                <Pressable style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={19} color="#6B7280" />
                </Pressable>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

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
              <Pressable onPress={() => Alert.alert('Forgot Password', "This isn't available yet — please contact support if you're locked out.")}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
                submitting && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </Pressable>
            <View style={styles.signUpRow}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <Pressable onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 40,
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
  passwordWrapper: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 44 },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: 48,
    justifyContent: 'center',
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
  loginButtonDisabled: {
    opacity: 0.8,
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
});