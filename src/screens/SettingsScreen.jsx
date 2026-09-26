import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
  Animated,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api/client';
import { logout } from '../api/auth';
import { generateScoutReport, generateCoachReport, generateLeagueReport } from '../api/Reports';

const REPORT_SCOPES = [
  { id: 'Watchlist', label: 'Shortlisted (Watchlist)' },
  { id: 'Favorites', label: 'Favorites' },
  { id: 'Scouted', label: 'All Scouted Athletes' },
];

const MATCH_TYPES = [
  { id: '', label: 'All Types' },
  { id: 'League', label: 'League' },
  { id: 'Cup', label: 'Cup' },
  { id: 'Friendly', label: 'Friendly' },
  { id: 'Tournament', label: 'Tournament' },
];

const MATCH_RESULTS = [
  { id: '', label: 'All Results' },
  { id: 'Win', label: 'Win' },
  { id: 'Draw', label: 'Draw' },
  { id: 'Loss', label: 'Loss' },
];

const COLORS = {
  cyan: '#06B6D4',
  cyanDark: '#0891B2',
  cyanLight: '#ECFEFF',
  black: '#000000',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  red: '#EF4444',
  redLight: '#FEF2F2',
  green: '#22C55E',
};

const LANGUAGES = [
  { id: 'en', label: 'English (US)' },
  { id: 'af', label: 'Afrikaans' },
  { id: 'zu', label: 'Zulu' },
  { id: 'xh', label: 'Xhosa' },
  { id: 'st', label: 'Sesotho' },
  { id: 'tn', label: 'Setswana' },
];

const APP_VERSION = '1.0.0';
const APP_BUILD = '2026.07';

export default function SettingsScreen({ navigation }) {
  const [role, setRole] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [scoutMessaging, setScoutMessaging] = useState(true);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    // Scout fields
    scope: 'Watchlist',
    tag: '',
    region: '',
    sport: '',
    position: '',
    minimumRating: '',
    // Coach fields
    matchType: '',
    result: '',
    // League Admin fields
    competitionId: '',
    // Shared
    dateFrom: null,
    dateTo: null,
    format: 'pdf',
  });

  useEffect(() => {
    (async () => {
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);
    })();
  }, []);

  const [showPrivacyExpanded, setShowPrivacyExpanded] = useState(false);
  const [showSecurityExpanded, setShowSecurityExpanded] = useState(false);
  const [showLanguageExpanded, setShowLanguageExpanded] = useState(false);
  const [showHelpExpanded, setShowHelpExpanded] = useState(false);
  const [showAboutExpanded, setShowAboutExpanded] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  const privacyAnim = useRef(new Animated.Value(0)).current;
  const securityAnim = useRef(new Animated.Value(0)).current;
  const languageAnim = useRef(new Animated.Value(0)).current;
  const helpAnim = useRef(new Animated.Value(0)).current;
  const aboutAnim = useRef(new Animated.Value(0)).current;

  const rotate = (anim) =>
    anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '90deg'],
    });

  const animateToggle = (anim, isOpen, setOpen) => {
    Animated.timing(anim, {
      toValue: isOpen ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setOpen(!isOpen);
  };

  const switchProps = {
    trackColor: { false: COLORS.gray300, true: COLORS.cyan },
    thumbColor: COLORS.white,
    ios_backgroundColor: COLORS.gray300,
  };

  const resetPasswordForm = () => {
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  const handlePasswordUpdate = async () => {
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (passwordForm.newPass.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }

    if (passwordForm.newPass !== passwordForm.confirm) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await api.put('/api/User/me/password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPass,
      });

      Alert.alert('Success', 'Password updated successfully!');
      setShowChangePasswordModal(false);
      resetPasswordForm();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        Alert.alert('Error', 'Current password is incorrect.');
      } else {
        Alert.alert('Error', err?.response?.data ?? 'Could not update password.');
      }
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout(); // clears token/userId/role from AsyncStorage
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const updateReportFilter = (field, value) => {
    setReportFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toDateOnlyString = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleGenerateReport = async () => {
    setReportGenerating(true);
    try {
      let fileName;
      if (role === 'Coach') {
        ({ fileName } = await generateCoachReport({
          dateFrom: toDateOnlyString(reportFilters.dateFrom),
          dateTo: toDateOnlyString(reportFilters.dateTo),
          matchType: reportFilters.matchType,
          result: reportFilters.result,
          format: reportFilters.format,
        }));
      } else if (role === 'LeagueAdmin') {
        ({ fileName } = await generateLeagueReport({
          competitionId: reportFilters.competitionId,
          dateFrom: toDateOnlyString(reportFilters.dateFrom),
          dateTo: toDateOnlyString(reportFilters.dateTo),
          format: reportFilters.format,
        }));
      } else {
        ({ fileName } = await generateScoutReport({
          scope: reportFilters.scope,
          tag: reportFilters.tag,
          dateFrom: toDateOnlyString(reportFilters.dateFrom),
          dateTo: toDateOnlyString(reportFilters.dateTo),
          region: reportFilters.region,
          sport: reportFilters.sport,
          position: reportFilters.position,
          minimumRating: reportFilters.minimumRating,
          format: reportFilters.format,
        }));
      }

      setShowReportModal(false);
      Alert.alert('Report Ready', `${fileName} was generated. Use the share sheet to save or send it.`);
    } catch (err) {
      const status = err?.response?.status;
      const serverMessage = typeof err?.response?.data === 'string' ? err.response.data : null;

      console.log('[report] generation failed', { status, serverMessage, message: err?.message });

      if (status === 404) {
        Alert.alert('No Results', serverMessage || 'No athletes match the filters you selected. Try widening your date range or removing a filter.');
      } else if (status === 401) {
        Alert.alert('Session Expired', 'Please log out and log back in, then try generating the report again.');
      } else if (status) {
        Alert.alert('Report Failed', serverMessage || `The server returned an error (${status}). Check the backend console for details.`);
      } else {
        Alert.alert('Report Failed', `Could not reach the server: ${err?.message || 'unknown error'}. Check that the API is running and reachable.`);
      }
    } finally {
      setReportGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color={COLORS.gray700} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>PRIME SCOUT</Text>
        </View>

        <Text style={styles.headerSubtitle}>Update your personal information</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <ExpandableRow
            title="Privacy Settings"
            subtitle="Control who can see your information"
            icon="lock"
            anim={privacyAnim}
            rotateValue={rotate(privacyAnim)}
            onPress={() => animateToggle(privacyAnim, showPrivacyExpanded, setShowPrivacyExpanded)}
            borderBottom={!showPrivacyExpanded}
          />

          {showPrivacyExpanded && (
            <View style={styles.expandedPanel}>
              <ToggleRow
                title="Public Profile"
                subtitle="Make your profile visible to scouts"
                value={profileVisibility}
                onValueChange={setProfileVisibility}
                switchProps={switchProps}
              />

              <ToggleRow
                title="Scout Messaging"
                subtitle="Allow scouts to message you"
                value={scoutMessaging}
                onValueChange={setScoutMessaging}
                switchProps={switchProps}
              />

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.linkButton}
                onPress={() => Alert.alert('Privacy', 'Full privacy management coming soon.')}
              >
                <Text style={styles.linkText}>Manage Privacy →</Text>
              </TouchableOpacity>
            </View>
          )}

          <SettingsSwitchRow
            title="Notifications"
            subtitle="Manage notification preferences"
            icon="bell"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            switchProps={switchProps}
          />

          <ExpandableRow
            title="Security"
            subtitle="Password and authentication settings"
            icon="shield"
            anim={securityAnim}
            rotateValue={rotate(securityAnim)}
            onPress={() => animateToggle(securityAnim, showSecurityExpanded, setShowSecurityExpanded)}
            borderBottom={!showSecurityExpanded}
          />

          {showSecurityExpanded && (
            <View style={styles.expandedPanel}>
              <ActionLink title="Change Password" onPress={() => setShowChangePasswordModal(true)} />

              <ActionLink
                title="Enable 2FA"
                onPress={() => Alert.alert('2FA', 'Two-factor authentication setup coming soon.')}
              />
            </View>
          )}

          <ExpandableRow
            title="Language"
            subtitle={selectedLanguage}
            icon="globe"
            anim={languageAnim}
            rotateValue={rotate(languageAnim)}
            onPress={() => animateToggle(languageAnim, showLanguageExpanded, setShowLanguageExpanded)}
            borderBottom={!showLanguageExpanded}
          />

          {showLanguageExpanded && (
            <View style={styles.languagePanel}>
              {LANGUAGES.map((lang, index) => {
                const selected = lang.label === selectedLanguage;

                return (
                  <TouchableOpacity
                    key={lang.id}
                    activeOpacity={0.75}
                    style={[styles.languageRow, index !== LANGUAGES.length - 1 && styles.languageBorder]}
                    onPress={() => {
                      setSelectedLanguage(lang.label);
                      setShowLanguageExpanded(false);
                      Animated.timing(languageAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                      }).start();
                    }}
                  >
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.cyan} />
                    ) : (
                      <View style={styles.languageEmptyIcon} />
                    )}

                    <Text style={[styles.languageText, selected && styles.languageTextSelected]}>
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <SettingsSwitchRow
            title="Dark Mode"
            subtitle="Enable dark theme"
            icon="moon"
            value={darkModeEnabled}
            isLast
            onValueChange={() => {
              const nextValue = !darkModeEnabled;
              setDarkModeEnabled(nextValue);
              Alert.alert(
                'Dark Mode',
                nextValue ? 'Dark mode enabled. Full theme coming soon.' : 'Dark mode disabled.'
              );
            }}
            switchProps={switchProps}
          />
        </View>

        <View style={styles.card}>
          <SupportRow
            title="Help & Support"
            subtitle="Get help or contact support"
            anim={helpAnim}
            rotateValue={rotate(helpAnim)}
            onPress={() => animateToggle(helpAnim, showHelpExpanded, setShowHelpExpanded)}
            borderBottom={!showHelpExpanded}
          />

          {showHelpExpanded && (
            <View style={styles.expandedPanel}>
              <SupportOption
                icon="help-circle"
                title="Frequently Asked Questions"
                onPress={() => Alert.alert('FAQ', 'FAQ section coming soon.')}
              />
              <SupportOption
                icon="mail"
                title="Contact Support"
                onPress={() => Alert.alert('Contact', 'Email: support@primescout.co.za')}
              />
              <SupportOption
                icon="flag"
                title="Report a Problem"
                onPress={() => Alert.alert('Report', 'Problem reporting coming soon.')}
              />
            </View>
          )}

          <SupportRow
            title="About"
            subtitle={`Version ${APP_VERSION}`}
            anim={aboutAnim}
            rotateValue={rotate(aboutAnim)}
            onPress={() => animateToggle(aboutAnim, showAboutExpanded, setShowAboutExpanded)}
            borderBottom={false}
          />

          {showAboutExpanded && (
            <View style={styles.aboutPanel}>
              <AboutItem label="App Name" value="PRIME SCOUT" />
              <AboutItem label="Version" value={APP_VERSION} />
              <AboutItem label="Build" value={APP_BUILD} />
              <AboutItem label="Platform" value="South African Sports Talent Discovery" />
              <AboutItem label="Developer" value="Prime Scout Technologies" />
              <AboutItem label="Contact" value="hello@primescout.co.za" />

              <View style={styles.aboutDivider} />

              <View style={styles.legalRow}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => Alert.alert('Terms', 'Terms of Service coming soon.')}
                >
                  <Text style={styles.legalText}>Terms of Service</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => Alert.alert('Privacy Policy', 'Privacy Policy coming soon.')}
                >
                  <Text style={styles.legalText}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Reports — Scout, Coach, and League Admin are all built. */}
        {(role === 'Scout' || role === 'Coach' || role === 'LeagueAdmin') && (
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[styles.settingsRow]}
              onPress={() => setShowReportModal(true)}
            >
              <View style={styles.iconCircle}>
                <Feather name="file-text" size={22} color={COLORS.cyanDark} />
              </View>

              <View style={styles.rowTextColumn}>
                <Text style={styles.rowTitle}>Generate Report</Text>
                <Text style={styles.rowSubtitle}>
                  {role === 'Coach'
                    ? 'Export team matches and player performance'
                    : role === 'LeagueAdmin'
                    ? 'Export standings, top scorers, and fixtures'
                    : 'Export your scouting data to PDF or Excel'}
                </Text>
              </View>

              <Feather name="chevron-right" size={18} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.logoutCard}
          onPress={() => setShowLogoutModal(true)}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          resetPasswordForm();
        }}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
        onSave={handlePasswordUpdate}
        submitting={passwordSubmitting}
      />

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        role={role}
        filters={reportFilters}
        updateFilter={updateReportFilter}
        onGenerate={handleGenerateReport}
        generating={reportGenerating}
      />
    </SafeAreaView>
  );
}

function ExpandableRow({ title, subtitle, icon, rotateValue, onPress, borderBottom = true }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[styles.settingsRow, borderBottom && styles.rowBorder]}
      onPress={onPress}
    >
      <View style={styles.iconCircle}>
        <Feather name={icon} size={22} color={COLORS.cyanDark} />
      </View>

      <View style={styles.rowTextColumn}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <Animated.View style={{ transform: [{ rotate: rotateValue }] }}>
        <Feather name="chevron-right" size={18} color={COLORS.gray400} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function SettingsSwitchRow({ title, subtitle, icon, value, onValueChange, switchProps, isLast = false }) {
  return (
    <View style={[styles.settingsRow, !isLast && styles.rowBorder]}>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={22} color={COLORS.cyanDark} />
      </View>

      <View style={styles.rowTextColumn}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <Switch value={value} onValueChange={onValueChange} {...switchProps} />
    </View>
  );
}

function ToggleRow({ title, subtitle, value, onValueChange, switchProps }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>

      <Switch value={value} onValueChange={onValueChange} {...switchProps} />
    </View>
  );
}

function ActionLink({ title, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.actionLink} onPress={onPress}>
      <Text style={styles.actionLinkText}>{title}</Text>
      <Feather name="chevron-right" size={16} color={COLORS.gray400} />
    </TouchableOpacity>
  );
}

function SupportRow({ title, subtitle, rotateValue, onPress, borderBottom }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[styles.supportRow, borderBottom && styles.rowBorder]}
      onPress={onPress}
    >
      <View style={styles.rowTextColumn}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <Animated.View style={{ transform: [{ rotate: rotateValue }] }}>
        <Feather name="chevron-right" size={18} color={COLORS.gray400} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function SupportOption({ icon, title, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.supportOption} onPress={onPress}>
      <Feather name={icon} size={18} color={COLORS.cyan} />
      <Text style={styles.supportOptionText}>{title}</Text>
    </TouchableOpacity>
  );
}

function AboutItem({ label, value }) {
  return (
    <View style={styles.aboutItem}>
      <Text style={styles.aboutKey}>{label}</Text>
      <Text style={styles.aboutValue}>{value}</Text>
    </View>
  );
}

function LogoutModal({ visible, onClose, onConfirm }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <Text style={styles.logoutModalTitle}>Log Out</Text>

          <Text style={styles.logoutModalText}>
            Are you sure you want to log out of your PRIME SCOUT account?
          </Text>

          <TouchableOpacity activeOpacity={0.75} style={styles.confirmLogoutButton} onPress={onConfirm}>
            <Text style={styles.confirmLogoutText}>Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.75} style={styles.cancelLogoutButton} onPress={onClose}>
            <Text style={styles.cancelLogoutText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ChangePasswordModal({ visible, onClose, passwordForm, setPasswordForm, onSave, submitting }) {
  const updatePassword = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <TouchableOpacity activeOpacity={0.75} style={styles.modalCloseButton} onPress={onClose}>
            <Feather name="x" size={20} color={COLORS.gray600} />
          </TouchableOpacity>

          <Text style={styles.passwordModalTitle}>Change Password</Text>
          <Text style={styles.passwordModalSubtitle}>
            Choose a strong password at least 6 characters long.
          </Text>

          <PasswordInput
            label="Current Password"
            placeholder="Enter current password"
            value={passwordForm.current}
            onChangeText={(text) => updatePassword('current', text)}
          />

          <PasswordInput
            label="New Password"
            placeholder="Enter new password (min 6 chars)"
            value={passwordForm.newPass}
            onChangeText={(text) => updatePassword('newPass', text)}
          />

          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={passwordForm.confirm}
            onChangeText={(text) => updatePassword('confirm', text)}
          />

          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.updatePasswordButton, submitting && { opacity: 0.7 }]}
            onPress={onSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.updatePasswordText}>Update Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.75} style={styles.cancelPasswordButton} onPress={onClose}>
            <Text style={styles.cancelPasswordText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ReportModal({ visible, onClose, role, filters, updateFilter, onGenerate, generating }) {
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
  const [competitions, setCompetitions] = useState([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [competitionsError, setCompetitionsError] = useState(null);
  const isCoach = role === 'Coach';
  const isLeagueAdmin = role === 'LeagueAdmin';
  const isScout = role === 'Scout';

  useEffect(() => {
    if (!visible || !isLeagueAdmin) return;

    let cancelled = false;
    setLoadingCompetitions(true);
    setCompetitionsError(null);

    api
      .get('/api/LeagueAdmin/GetMyCompetitions')
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setCompetitions(list);
        // Auto-select when the admin only runs one competition, so they
        // aren't forced to tap a single chip before generating.
        if (list.length === 1 && !filters.competitionId) {
          updateFilter('competitionId', String(list[0].competitionId));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.log('[reports] failed to load competitions:', err?.response?.status, err?.message);
        setCompetitionsError('Could not load your competitions.');
      })
      .finally(() => {
        if (!cancelled) setLoadingCompetitions(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isLeagueAdmin]);

  const formatDate = (date) => {
    if (!date) return 'Any';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.modalSheet, styles.reportModalSheet]}>
          <View style={styles.modalHandle} />

          <TouchableOpacity activeOpacity={0.75} style={styles.modalCloseButton} onPress={onClose}>
            <Feather name="x" size={20} color={COLORS.gray600} />
          </TouchableOpacity>

          <Text style={styles.passwordModalTitle}>Generate Report</Text>
          <Text style={styles.passwordModalSubtitle}>
            {isCoach
              ? 'Choose which matches and players to include — the report is built from exactly what you select below.'
              : isLeagueAdmin
              ? 'Choose which competition and date range to include — the report is built from exactly what you select below.'
              : 'Choose which athletes and stats to include — the report is built from exactly what you select below.'}
          </Text>

          <ScrollView style={styles.reportScroll} showsVerticalScrollIndicator={false}>
            {isLeagueAdmin && (
              <>
                <Text style={styles.reportSectionLabel}>Competition</Text>

                {loadingCompetitions && (
                  <View style={{ paddingVertical: 8 }}>
                    <ActivityIndicator color={COLORS.cyanDark} />
                  </View>
                )}

                {!loadingCompetitions && competitionsError && (
                  <Text style={{ color: COLORS.red, marginBottom: 8 }}>{competitionsError}</Text>
                )}

                {!loadingCompetitions && !competitionsError && competitions.length === 0 && (
                  <Text style={{ color: COLORS.gray500, marginBottom: 8 }}>
                    You haven't created any competitions yet.
                  </Text>
                )}

                {!loadingCompetitions && competitions.length > 0 && (
                  <View style={styles.reportChipRow}>
                    {competitions.map((c) => {
                      const selected = String(filters.competitionId) === String(c.competitionId);
                      return (
                        <TouchableOpacity
                          key={c.competitionId}
                          activeOpacity={0.75}
                          style={[styles.reportChip, selected && styles.reportChipSelected]}
                          onPress={() => updateFilter('competitionId', String(c.competitionId))}
                        >
                          <Text style={[styles.reportChipText, selected && styles.reportChipTextSelected]}>
                            {c.competitionName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {isScout && (
              <>
                <Text style={styles.reportSectionLabel}>Athletes to Include</Text>
                <View style={styles.reportChipRow}>
                  {REPORT_SCOPES.map((s) => {
                    const selected = filters.scope === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        activeOpacity={0.75}
                        style={[styles.reportChip, selected && styles.reportChipSelected]}
                        onPress={() => updateFilter('scope', s.id)}
                      >
                        <Text style={[styles.reportChipText, selected && styles.reportChipTextSelected]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {filters.scope === 'Watchlist' && (
                  <View style={styles.reportField}>
                    <Text style={styles.reportFieldLabel}>Shortlist Tag (optional)</Text>
                    <TextInput
                      style={styles.reportInput}
                      placeholder="e.g. Priority, Prospect"
                      placeholderTextColor={COLORS.gray400}
                      value={filters.tag}
                      onChangeText={(text) => updateFilter('tag', text)}
                    />
                  </View>
                )}
              </>
            )}

            {isCoach && (
              <>
                <Text style={styles.reportSectionLabel}>Match Type</Text>
                <View style={styles.reportChipRow}>
                  {MATCH_TYPES.map((t) => {
                    const selected = filters.matchType === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id || 'all'}
                        activeOpacity={0.75}
                        style={[styles.reportChip, selected && styles.reportChipSelected]}
                        onPress={() => updateFilter('matchType', t.id)}
                      >
                        <Text style={[styles.reportChipText, selected && styles.reportChipTextSelected]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.reportSectionLabel}>Result</Text>
                <View style={styles.reportChipRow}>
                  {MATCH_RESULTS.map((r) => {
                    const selected = filters.result === r.id;
                    return (
                      <TouchableOpacity
                        key={r.id || 'all'}
                        activeOpacity={0.75}
                        style={[styles.reportChip, selected && styles.reportChipSelected]}
                        onPress={() => updateFilter('result', r.id)}
                      >
                        <Text style={[styles.reportChipText, selected && styles.reportChipTextSelected]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.reportSectionLabel}>Match Date Range</Text>
            <View style={styles.reportDateRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.reportDateButton}
                onPress={() => setShowDateFromPicker(true)}
              >
                <Text style={styles.reportDateLabel}>From</Text>
                <Text style={styles.reportDateValue}>{formatDate(filters.dateFrom)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.reportDateButton}
                onPress={() => setShowDateToPicker(true)}
              >
                <Text style={styles.reportDateLabel}>To</Text>
                <Text style={styles.reportDateValue}>{formatDate(filters.dateTo)}</Text>
              </TouchableOpacity>
            </View>

            {showDateFromPicker && (
              <DateTimePicker
                value={filters.dateFrom || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, date) => {
                  setShowDateFromPicker(false);
                  if (date) updateFilter('dateFrom', date);
                }}
              />
            )}

            {showDateToPicker && (
              <DateTimePicker
                value={filters.dateTo || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, date) => {
                  setShowDateToPicker(false);
                  if (date) updateFilter('dateTo', date);
                }}
              />
            )}

            {isScout && (
              <>
                <Text style={styles.reportSectionLabel}>Filter Athletes By</Text>

                <View style={styles.reportField}>
                  <Text style={styles.reportFieldLabel}>Location</Text>
                  <TextInput
                    style={styles.reportInput}
                    placeholder="e.g. Gauteng"
                    placeholderTextColor={COLORS.gray400}
                    value={filters.region}
                    onChangeText={(text) => updateFilter('region', text)}
                  />
                </View>

                <View style={styles.reportField}>
                  <Text style={styles.reportFieldLabel}>Sport</Text>
                  <TextInput
                    style={styles.reportInput}
                    placeholder="e.g. Soccer"
                    placeholderTextColor={COLORS.gray400}
                    value={filters.sport}
                    onChangeText={(text) => updateFilter('sport', text)}
                  />
                </View>

                <View style={styles.reportField}>
                  <Text style={styles.reportFieldLabel}>Position</Text>
                  <TextInput
                    style={styles.reportInput}
                    placeholder="e.g. Striker"
                    placeholderTextColor={COLORS.gray400}
                    value={filters.position}
                    onChangeText={(text) => updateFilter('position', text)}
                  />
                </View>

                <View style={styles.reportField}>
                  <Text style={styles.reportFieldLabel}>Minimum Average Rating</Text>
                  <TextInput
                    style={styles.reportInput}
                    placeholder="e.g. 7.5"
                    placeholderTextColor={COLORS.gray400}
                    value={filters.minimumRating}
                    onChangeText={(text) => updateFilter('minimumRating', text.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </>
            )}

            <Text style={styles.reportSectionLabel}>Export Format</Text>
            <View style={styles.reportChipRow}>
              {[
                { id: 'pdf', label: 'PDF' },
                { id: 'excel', label: 'Excel' },
              ].map((f) => {
                const selected = filters.format === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    activeOpacity={0.75}
                    style={[styles.reportChip, selected && styles.reportChipSelected]}
                    onPress={() => updateFilter('format', f.id)}
                  >
                    <Text style={[styles.reportChipText, selected && styles.reportChipTextSelected]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.updatePasswordButton, generating && { opacity: 0.7 }]}
            onPress={onGenerate}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.updatePasswordText}>Generate Report</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.75} style={styles.cancelPasswordButton} onPress={onClose}>
            <Text style={styles.cancelPasswordText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PasswordInput({ label, placeholder, value, onChangeText }) {
  return (
    <View style={styles.passwordField}>
      <Text style={styles.passwordLabel}>{label}</Text>

      <TextInput
        style={styles.passwordInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray400}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.gray50 },

  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: COLORS.black },
  headerSubtitle: { paddingLeft: 48, fontSize: 13, color: COLORS.gray600 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },

  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  supportRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cyanLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowTextColumn: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  rowSubtitle: { fontSize: 13, color: COLORS.gray600, marginTop: 2 },

  expandedPanel: {
    backgroundColor: COLORS.gray50,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    padding: 16,
    gap: 14,
  },

  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  toggleTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  toggleSubtitle: { fontSize: 12, color: COLORS.gray600, marginTop: 2 },

  linkButton: { marginTop: 2 },
  linkText: { color: COLORS.cyan, fontSize: 13, fontWeight: '600' },

  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },

  actionLinkText: { flex: 1, fontSize: 14, color: COLORS.gray700, fontWeight: '500' },

  languagePanel: {
    backgroundColor: COLORS.gray50,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingVertical: 8,
  },

  languageRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  languageBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  languageEmptyIcon: { width: 20, height: 20 },
  languageText: { fontSize: 14, fontWeight: '400', color: COLORS.gray700 },
  languageTextSelected: { fontWeight: '600', color: COLORS.cyan },

  supportOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  supportOptionText: { fontSize: 14, color: COLORS.gray700 },

  aboutPanel: { backgroundColor: COLORS.gray50, borderTopWidth: 1, borderTopColor: COLORS.gray100, padding: 16 },
  aboutItem: { flexDirection: 'row', paddingVertical: 6 },
  aboutKey: { width: 90, fontSize: 12, color: COLORS.gray500, fontWeight: '500' },
  aboutValue: { flex: 1, fontSize: 12, color: COLORS.gray700, fontWeight: '400' },
  aboutDivider: { height: 1, backgroundColor: COLORS.gray200, marginVertical: 12 },
  legalRow: { flexDirection: 'row', gap: 16 },
  legalText: { fontSize: 12, color: COLORS.cyan, fontWeight: '500' },

  logoutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },

  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.red, textAlign: 'center' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },

  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },

  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
    alignSelf: 'center',
    marginBottom: 20,
  },

  logoutModalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black, textAlign: 'center', marginBottom: 8 },
  logoutModalText: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  confirmLogoutButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  confirmLogoutText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },

  cancelLogoutButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelLogoutText: { color: COLORS.gray700, fontWeight: '600', fontSize: 15 },

  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  passwordModalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  passwordModalSubtitle: { fontSize: 13, color: COLORS.gray500, marginBottom: 20 },

  passwordField: { marginBottom: 14 },
  passwordLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },

  passwordInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.black,
  },

  updatePasswordButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  updatePasswordText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },

  cancelPasswordButton: { width: '100%', height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  cancelPasswordText: { fontSize: 14, color: COLORS.gray500 },

  reportModalSheet: { maxHeight: '88%' },
  reportScroll: { maxHeight: 420, marginBottom: 8 },

  reportSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },

  reportChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  reportChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
  },

  reportChipSelected: {
    borderColor: COLORS.cyan,
    backgroundColor: COLORS.cyanLight,
  },

  reportChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
  reportChipTextSelected: { color: COLORS.cyanDark },

  reportField: { marginBottom: 12 },
  reportFieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, marginBottom: 6 },

  reportInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.black,
  },

  reportDateRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },

  reportDateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  reportDateLabel: { fontSize: 11, color: COLORS.gray500, fontWeight: '600', marginBottom: 2 },
  reportDateValue: { fontSize: 14, color: COLORS.black, fontWeight: '500' },
});