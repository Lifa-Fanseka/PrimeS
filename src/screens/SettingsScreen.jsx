import React, { useRef, useState } from 'react';
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
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [scoutMessaging, setScoutMessaging] = useState(true);

  const [showPrivacyExpanded, setShowPrivacyExpanded] = useState(false);
  const [showSecurityExpanded, setShowSecurityExpanded] = useState(false);
  const [showLanguageExpanded, setShowLanguageExpanded] = useState(false);
  const [showHelpExpanded, setShowHelpExpanded] = useState(false);
  const [showAboutExpanded, setShowAboutExpanded] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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
    setPasswordForm({
      current: '',
      newPass: '',
      confirm: '',
    });
  };

  const handlePasswordUpdate = () => {
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

    Alert.alert('Success', 'Password updated successfully!');
    setShowChangePasswordModal(false);
    resetPasswordForm();
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
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

        <Text style={styles.headerSubtitle}>
          Update your personal information
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <ExpandableRow
            title="Privacy Settings"
            subtitle="Control who can see your information"
            icon="lock"
            anim={privacyAnim}
            rotateValue={rotate(privacyAnim)}
            onPress={() =>
              animateToggle(
                privacyAnim,
                showPrivacyExpanded,
                setShowPrivacyExpanded
              )
            }
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
                onPress={() =>
                  Alert.alert('Privacy', 'Full privacy management coming soon.')
                }
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
            onPress={() =>
              animateToggle(
                securityAnim,
                showSecurityExpanded,
                setShowSecurityExpanded
              )
            }
            borderBottom={!showSecurityExpanded}
          />

          {showSecurityExpanded && (
            <View style={styles.expandedPanel}>
              <ActionLink
                title="Change Password"
                onPress={() => setShowChangePasswordModal(true)}
              />

              <ActionLink
                title="Enable 2FA"
                onPress={() =>
                  Alert.alert('2FA', 'Two-factor authentication setup coming soon.')
                }
              />
            </View>
          )}

          <ExpandableRow
            title="Language"
            subtitle={selectedLanguage}
            icon="globe"
            anim={languageAnim}
            rotateValue={rotate(languageAnim)}
            onPress={() =>
              animateToggle(
                languageAnim,
                showLanguageExpanded,
                setShowLanguageExpanded
              )
            }
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
                    style={[
                      styles.languageRow,
                      index !== LANGUAGES.length - 1 && styles.languageBorder,
                    ]}
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
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={COLORS.cyan}
                      />
                    ) : (
                      <View style={styles.languageEmptyIcon} />
                    )}

                    <Text
                      style={[
                        styles.languageText,
                        selected && styles.languageTextSelected,
                      ]}
                    >
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
                nextValue
                  ? 'Dark mode enabled. Full theme coming soon.'
                  : 'Dark mode disabled.'
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
            onPress={() =>
              animateToggle(helpAnim, showHelpExpanded, setShowHelpExpanded)
            }
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
                onPress={() =>
                  Alert.alert('Contact', 'Email: support@primescout.co.za')
                }
              />
              <SupportOption
                icon="flag"
                title="Report a Problem"
                onPress={() =>
                  Alert.alert('Report', 'Problem reporting coming soon.')
                }
              />
            </View>
          )}

          <SupportRow
            title="About"
            subtitle={`Version ${APP_VERSION}`}
            anim={aboutAnim}
            rotateValue={rotate(aboutAnim)}
            onPress={() =>
              animateToggle(aboutAnim, showAboutExpanded, setShowAboutExpanded)
            }
            borderBottom={false}
          />

          {showAboutExpanded && (
            <View style={styles.aboutPanel}>
              <AboutItem label="App Name" value="PRIME SCOUT" />
              <AboutItem label="Version" value={APP_VERSION} />
              <AboutItem label="Build" value={APP_BUILD} />
              <AboutItem
                label="Platform"
                value="South African Sports Talent Discovery"
              />
              <AboutItem label="Developer" value="Prime Scout Technologies" />
              <AboutItem label="Contact" value="hello@primescout.co.za" />

              <View style={styles.aboutDivider} />

              <View style={styles.legalRow}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() =>
                    Alert.alert('Terms', 'Terms of Service coming soon.')
                  }
                >
                  <Text style={styles.legalText}>Terms of Service</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() =>
                    Alert.alert('Privacy Policy', 'Privacy Policy coming soon.')
                  }
                >
                  <Text style={styles.legalText}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

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
      />
    </SafeAreaView>
  );
}

function ExpandableRow({
  title,
  subtitle,
  icon,
  rotateValue,
  onPress,
  borderBottom = true,
}) {
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

function SettingsSwitchRow({
  title,
  subtitle,
  icon,
  value,
  onValueChange,
  switchProps,
  isLast = false,
}) {
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
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.actionLink}
      onPress={onPress}
    >
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
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.supportOption}
      onPress={onPress}
    >
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

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.confirmLogoutButton}
            onPress={onConfirm}
          >
            <Text style={styles.confirmLogoutText}>Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.cancelLogoutButton}
            onPress={onClose}
          >
            <Text style={styles.cancelLogoutText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ChangePasswordModal({
  visible,
  onClose,
  passwordForm,
  setPasswordForm,
  onSave,
}) {
  const updatePassword = (field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.modalCloseButton}
            onPress={onClose}
          >
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
            style={styles.updatePasswordButton}
            onPress={onSave}
          >
            <Text style={styles.updatePasswordText}>Update Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.cancelPasswordButton}
            onPress={onClose}
          >
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
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },

  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
  },

  headerSubtitle: {
    paddingLeft: 48,
    fontSize: 13,
    color: COLORS.gray600,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

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

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },

  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },

  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cyanLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowTextColumn: {
    flex: 1,
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },

  rowSubtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 2,
  },

  expandedPanel: {
    backgroundColor: COLORS.gray50,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    padding: 16,
    gap: 14,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },

  toggleSubtitle: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },

  linkButton: {
    marginTop: 2,
  },

  linkText: {
    color: COLORS.cyan,
    fontSize: 13,
    fontWeight: '600',
  },

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

  actionLinkText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray700,
    fontWeight: '500',
  },

  languagePanel: {
    backgroundColor: COLORS.gray50,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingVertical: 8,
  },

  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },

  languageBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },

  languageEmptyIcon: {
    width: 20,
    height: 20,
  },

  languageText: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.gray700,
  },

  languageTextSelected: {
    fontWeight: '600',
    color: COLORS.cyan,
  },

  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },

  supportOptionText: {
    fontSize: 14,
    color: COLORS.gray700,
  },

  aboutPanel: {
    backgroundColor: COLORS.gray50,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    padding: 16,
  },

  aboutItem: {
    flexDirection: 'row',
    paddingVertical: 6,
  },

  aboutKey: {
    width: 90,
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '500',
  },

  aboutValue: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray700,
    fontWeight: '400',
  },

  aboutDivider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 12,
  },

  legalRow: {
    flexDirection: 'row',
    gap: 16,
  },

  legalText: {
    fontSize: 12,
    color: COLORS.cyan,
    fontWeight: '500',
  },

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

  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.red,
    textAlign: 'center',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

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

  logoutModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 8,
  },

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

  confirmLogoutText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },

  cancelLogoutButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelLogoutText: {
    color: COLORS.gray700,
    fontWeight: '600',
    fontSize: 15,
  },

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

  passwordModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },

  passwordModalSubtitle: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: 20,
  },

  passwordField: {
    marginBottom: 14,
  },

  passwordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: 6,
  },

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

  updatePasswordText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },

  cancelPasswordButton: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  cancelPasswordText: {
    fontSize: 14,
    color: COLORS.gray500,
  },
});