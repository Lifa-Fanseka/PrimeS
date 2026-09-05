import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { register } from '../api/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

function calculateAge(dob) {
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    parentEmail: '',
  });
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const age = calculateAge(dateOfBirth);
  const isUnder18Athlete = form.role === 'Athlete' && age !== null && age < 18;

  const handleChangeDob = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      setErrors((prev) => ({ ...prev, dateOfBirth: '' }));
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!form.email.includes('@')) newErrors.email = 'Enter a valid email';
    if (!dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    else if (age < 1 || age > 100) newErrors.dateOfBirth = 'Please enter a valid date of birth';
    if (form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (form.confirmPassword !== form.password)
      newErrors.confirmPassword = 'Passwords do not match';
    if (!form.role) newErrors.role = 'Please select a role';

    if (isUnder18Athlete) {
      if (!form.parentEmail.trim())
        newErrors.parentEmail = "Your parent's email is required";
      else if (!form.parentEmail.includes('@'))
        newErrors.parentEmail = 'Enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        dateOfBirth: formatDateForApi(dateOfBirth),
      };

      if (isUnder18Athlete) {
        payload.parentEmail = form.parentEmail.trim();
      }

      const result = await register(payload);

      if (result.status === 'PendingParentConsent') {
        Alert.alert('Account Created', result.message, [
          { text: 'OK', onPress: () => navigation.navigate('Startup') },
        ]);
        return;
      }

      const dashboardByRole = {
        Athlete: 'AthleteDashboard',
        Coach: 'CoachDashboard',
        Scout: 'ScoutDashboard',
        Parent: 'ParentDashboard',
        LeagueAdmin: 'LeagueAdminDashboard',
      };

      navigation.reset({
        index: 0,
        routes: [{ name: dashboardByRole[result.role] ?? 'Startup' }],
      });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data;

      if (status === 400 && typeof message === 'string') {
        Alert.alert('Sign Up Failed', message);
      } else {
        Alert.alert('Sign Up Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
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
        autoCapitalize={field === 'email' || field === 'parentEmail' ? 'none' : 'sentences'}
        onFocus={() => setFocusedField(field)}
        onBlur={() => setFocusedField('')}
      />
      {errors[field] ? (
        <Text style={styles.errorText}>{errors[field]}</Text>
      ) : null}
    </View>
  );

  const renderPasswordInput = (label, field, placeholder, showValue, setShowValue) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={[
            styles.input,
            styles.passwordInput,
            focusedField === field && styles.inputFocused,
            errors[field] && styles.inputError,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={form[field]}
          onChangeText={(text) => updateField(field, text)}
          secureTextEntry={!showValue}
          autoCapitalize="none"
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField('')}
        />
        <Pressable style={styles.eyeButton} onPress={() => setShowValue(!showValue)} hitSlop={8}>
          <Feather name={showValue ? 'eye-off' : 'eye'} size={19} color="#6B7280" />
        </Pressable>
      </View>
      {errors[field] ? (
        <Text style={styles.errorText}>{errors[field]}</Text>
      ) : null}
    </View>
  );

  const roles = [
    { name: 'Athlete', icon: 'user' },
    { name: 'Scout', icon: 'crosshair' },
    { name: 'Coach', icon: 'users' },
    { name: 'Parent', icon: 'heart' },
    { name: 'LeagueAdmin', label: 'League Admin', icon: 'award' },
  ];

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

        {renderInput('Full Name', 'fullName', 'Enter your full name')}
        {renderInput('Email', 'email', 'your.email@example.com', 'email-address')}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <Pressable
            style={[styles.input, styles.dateInput, errors.dateOfBirth && styles.inputError]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={dateOfBirth ? styles.dateText : styles.datePlaceholder}>
              {dateOfBirth ? formatDateForDisplay(dateOfBirth) : 'Select your date of birth'}
            </Text>
            <Feather name="calendar" size={18} color="#6B7280" />
          </Pressable>
          {errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}
          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth || new Date(2005, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handleChangeDob}
            />
          )}
        </View>

        {renderPasswordInput('Password', 'password', 'Create a password (min 6 characters)', showPassword, setShowPassword)}
        {renderPasswordInput('Confirm Password', 'confirmPassword', 'Confirm your password', showConfirmPassword, setShowConfirmPassword)}

        <View style={styles.roleSection}>
          <Text style={styles.roleTitle}>Select Your Role</Text>
          <View style={styles.roleGrid}>
            {roles.map((role) => {
              const selected = form.role === role.name;
              return (
                <Pressable
                  key={role.name}
                  style={[styles.roleCard, selected && styles.roleCardSelected]}
                  onPress={() => updateField('role', role.name)}
                >
                  <Feather name={role.icon} size={24} color={selected ? '#06B6D4' : '#4B5563'} />
                  <Text style={[styles.roleText, selected && styles.roleTextSelected]}>
                    {role.label || role.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}
        </View>

        {isUnder18Athlete && (
          <View style={styles.parentCard}>
            <Text style={styles.parentTitle}>Parent Consent Required (Under 18)</Text>
            <Text style={styles.parentSubtitle}>
              Your parent must already have a PrimeScout account. We'll send them a request
              to approve your account — you'll be able to log in once they do.
            </Text>

            {renderInput(
              "Parent's Email",
              'parentEmail',
              'parent@example.com',
              'email-address'
            )}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
            submitting && { opacity: 0.7 },
          ]}
          onPress={handleCreateAccount}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>Create Account</Text>
          )}
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => navigation.navigate('Startup')}>
          <Text style={styles.backButtonText}>Back to Login</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingTop: 32, paddingBottom: 32, paddingHorizontal: 24 },
  logo: { fontSize: 24, fontWeight: '800', color: '#000000', marginBottom: 16 },
  heroImage: { width: '100%', height: 128, borderRadius: 16, marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 8 },
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
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 6 },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: { fontSize: 15, color: '#000000' },
  datePlaceholder: { fontSize: 15, color: '#9CA3AF' },
  passwordWrapper: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 44 },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: 48,
    justifyContent: 'center',
  },
  roleSection: { marginTop: 4, marginBottom: 16 },
  roleTitle: { fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 12 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roleCard: {
    width: '48%',
    height: 96,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  roleCardSelected: { borderColor: '#06B6D4', backgroundColor: '#ECFEFF' },
  roleText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  roleTextSelected: { color: '#0E7490' },
  parentCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  parentTitle: { fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 8 },
  parentSubtitle: { fontSize: 12, color: '#92400E', lineHeight: 18, marginBottom: 16 },
  createButton: {
    width: '100%',
    height: 56,
    borderRadius: 9999,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  createButtonPressed: { backgroundColor: '#0891B2' },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  backButton: { width: '100%', height: 32, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  backButtonText: { fontSize: 15, fontWeight: '500', color: '#4B5563' },
});