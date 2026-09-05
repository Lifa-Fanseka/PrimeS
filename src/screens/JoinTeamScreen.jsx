import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 390;
const responsive = (size) => Math.round(size * Math.min(Math.max(scale, 0.85), 1.18));

const COLORS = {
  cyan: '#06B6D4',
  blue: '#3B82F6',
  black: '#000000',
  white: '#FFFFFF',
  bg: '#F8F9FA',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  red: '#EF4444',
};

export default function JoinTeamScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      setError('Please enter a valid invite code.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await api.post('/api/Team/JoinTeam', { inviteCode: code.trim() });
      navigation.replace('MyTeam');
    } catch (err) {
      setError(err?.response?.data ?? 'Could not join. Please check your code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.75} style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join a Team</Text>
        <View style={{ width: responsive(36) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <View style={styles.heroCircle}>
            <Feather name="shield" size={44} color={COLORS.cyan} />
          </View>
          <Text style={styles.heroText}>Connect with your squad</Text>
        </View>

        <Text style={styles.sectionLabel}>Enter Invite Code</Text>

        <View style={[styles.inputWrap, error && styles.inputWrapError]}>
          <Feather name="link" size={18} color={COLORS.gray400} style={{ marginRight: responsive(8) }} />
          <TextInput
            style={styles.input}
            placeholder="Enter your team's invite code"
            placeholderTextColor={COLORS.gray400}
            autoCapitalize="characters"
            value={code}
            onChangeText={(t) => {
              setCode(t);
              if (error) setError('');
            }}
          />
          {code.length > 0 && (
            <TouchableOpacity onPress={() => setCode('')} activeOpacity={0.7}>
              <Feather name="x" size={18} color={COLORS.gray400} />
            </TouchableOpacity>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity activeOpacity={0.75} style={styles.hintRow} onPress={() => setShowHint(!showHint)}>
          <Feather name={showHint ? 'chevron-down' : 'chevron-right'} size={14} color={COLORS.gray500} />
          <Text style={styles.hintTrigger}>How to get a code?</Text>
        </TouchableOpacity>

        {showHint && (
          <Text style={styles.hintText}>
            Ask your coach to share your team's invite code from their Coach dashboard.
          </Text>
        )}

        <TouchableOpacity activeOpacity={0.85} style={styles.joinButtonWrap} onPress={handleJoin} disabled={submitting}>
          <LinearGradient colors={[COLORS.cyan, COLORS.blue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.joinButton}>
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.joinButtonText}>Join Team</Text>
                <Feather name="arrow-right" size={18} color={COLORS.white} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(14),
  },

  backButton: { width: responsive(36), height: responsive(36), alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: responsive(17), fontWeight: '700', color: COLORS.black },

  scrollContent: { paddingHorizontal: responsive(20), paddingTop: responsive(20), paddingBottom: responsive(40) },

  heroWrap: { alignItems: 'center', marginBottom: responsive(36) },

  heroCircle: {
    width: responsive(110),
    height: responsive(110),
    borderRadius: responsive(55),
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsive(16),
  },

  heroText: { fontSize: responsive(16), fontWeight: '600', color: COLORS.gray600 },

  sectionLabel: { fontSize: responsive(14), fontWeight: '700', color: COLORS.black, marginBottom: responsive(10) },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    borderRadius: responsive(12),
    paddingHorizontal: responsive(14),
    height: responsive(52),
  },

  inputWrapError: { borderColor: COLORS.red },

  input: { flex: 1, fontSize: responsive(15), color: COLORS.black },

  errorText: { color: COLORS.red, fontSize: responsive(13), marginTop: responsive(8) },

  hintRow: { flexDirection: 'row', alignItems: 'center', gap: responsive(4), marginTop: responsive(14) },
  hintTrigger: { fontSize: responsive(13), color: COLORS.gray500, fontWeight: '600' },
  hintText: { fontSize: responsive(13), color: COLORS.gray500, marginTop: responsive(8), lineHeight: responsive(19) },

  joinButtonWrap: { marginTop: responsive(32) },

  joinButton: {
    height: responsive(54),
    borderRadius: responsive(27),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive(8),
  },

  joinButtonText: { color: COLORS.white, fontSize: responsive(16), fontWeight: '700' },
});