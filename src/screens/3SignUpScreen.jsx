import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function SignUpScreen() {
  const navigation = useNavigation();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    password: '',
    confirmPassword: '',
    role: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
  });

  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const isUnder18Athlete =
    form.role === 'Athlete' && form.age !== '' && Number(form.age) < 18;

  const validateForm = () => {
    let newErrors = {};

    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!form.email.includes('@')) newErrors.email = 'Enter a valid email';

    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';

    if (!form.age.trim()) newErrors.age = 'Age is required';
    else if (Number(form.age) < 1 || Number(form.age) > 100)
      newErrors.age = 'Age must be between 1 and 100';

    if (form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    if (form.confirmPassword !== form.password)
      newErrors.confirmPassword = 'Passwords do not match';

    if (!form.role) newErrors.role = 'Please select a role';

    if (isUnder18Athlete) {
      if (!form.parentName.trim())
        newErrors.parentName = 'Parent/Guardian name is required';
      if (!form.parentEmail.trim())
        newErrors.parentEmail = 'Parent/Guardian email is required';
      if (!form.parentPhone.trim())
        newErrors.parentPhone = 'Parent/Guardian phone is required';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = () => {
    if (validateForm()) {
      alert('Account created successfully');
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
        onFocus={() => setFocusedField(field)}
        onBlur={() => setFocusedField('')}
      />

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
        {renderInput(
          'Email',
          'email',
          'your.email@example.com',
          'email-address'
        )}
        {renderInput('Phone Number', 'phone', '+27 XX XXX XXXX', 'phone-pad')}
        {renderInput('Age', 'age', 'Enter your age', 'numeric')}
        {renderInput(
          'Password',
          'password',
          'Create a password (min 6 characters)',
          'default',
          true
        )}
        {renderInput(
          'Confirm Password',
          'confirmPassword',
          'Confirm your password',
          'default',
          true
        )}

        <View style={styles.roleSection}>
          <Text style={styles.roleTitle}>Select Your Role</Text>

          <View style={styles.roleGrid}>
            {roles.map((role) => {
              const selected = form.role === role.name;

              return (
                <Pressable
                  key={role.name}
                  style={[
                    styles.roleCard,
                    selected && styles.roleCardSelected,
                  ]}
                  onPress={() => updateField('role', role.name)}
                >
                  <Feather
                    name={role.icon}
                    size={24}
                    color={selected ? '#06B6D4' : '#4B5563'}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      selected && styles.roleTextSelected,
                    ]}
                  >
                    {role.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}
        </View>

        {isUnder18Athlete && (
          <View style={styles.parentCard}>
            <Text style={styles.parentTitle}>
              Parent/Guardian Information Required (Under 18)
            </Text>

            {renderInput(
              'Parent/Guardian Name',
              'parentName',
              "Parent's full name"
            )}
            {renderInput(
              'Parent/Guardian Email',
              'parentEmail',
              'parent@example.com',
              'email-address'
            )}
            {renderInput(
              'Parent/Guardian Phone',
              'parentPhone',
              '+27 XX XXX XXXX',
              'phone-pad'
            )}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
          onPress={handleCreateAccount}
        >
          <Text style={styles.createButtonText}>Create Account</Text>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => navigation.navigate('Startup')}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </Pressable>
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
    marginBottom: 16,
  },

  heroImage: {
    width: '100%',
    height: 128,
    borderRadius: 16,
    marginBottom: 16,
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

  roleSection: {
    marginTop: 4,
    marginBottom: 16,
  },

  roleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },

  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

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

  roleCardSelected: {
    borderColor: '#06B6D4',
    backgroundColor: '#ECFEFF',
  },

  roleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },

  roleTextSelected: {
    color: '#0E7490',
  },

  parentCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },

  parentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 16,
  },

  createButton: {
    width: '100%',
    height: 56,
    borderRadius: 9999,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  createButtonPressed: {
    backgroundColor: '#0891B2',
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  backButton: {
    width: '100%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  backButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
  },
});