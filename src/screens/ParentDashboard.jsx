import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const scale = SCREEN_WIDTH / 390;
const responsive = size => Math.round(size * Math.min(scale, 1.18));

// No backend endpoint aggregates a parent-facing activity feed yet — stays static.
const RECENT_ACTIVITY = [
  {
    id: 'act1',
    icon: 'checkmark-circle',
    iconColor: '#16A34A',
    iconBg: '#F0FDF4',
    text: "Your coach verified your child's stats",
    time: 'Recently',
  },
  {
    id: 'act2',
    icon: 'shield-checkmark-outline',
    iconColor: '#0891B2',
    iconBg: '#ECFEFF',
    text: 'Consent requests are reviewed below',
    time: '',
  },
];

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// The offer's EventDate comes through as a plain "YYYY-MM-DD" string —
// parsed manually rather than with new Date() to avoid the same
// timezone-shift issue already found and fixed elsewhere this session.
function formatOfferDate(dateString) {
  if (!dateString) return null;
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function ChildProfileCard({ child, onViewProfile }) {
  const initials = (child.name || '?')
    .split(' ')
    .map(part => part[0])
    .join('');

  return (
    <View style={styles.childCard}>
      <View style={styles.childCardHeader}>
        <Text style={styles.childCardTitle}>Your Child's Profile</Text>
        {child.verified && <Ionicons name="checkmark-circle" size={20} color="#06B6D4" />}
      </View>

      <View style={styles.childInfoRow}>
        <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.childAvatar}>
          <Text style={styles.childAvatarText}>{initials}</Text>
        </LinearGradient>

        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.name}</Text>

          <Text style={styles.childSport}>
            {child.sport ?? '—'} • {child.position ?? '—'}
          </Text>

          {child.region ? (
            <View style={styles.childLocationRow}>
              <Ionicons name="location-outline" size={12} color="#6B7280" />
              <Text style={styles.childLocation}>{child.region}</Text>
            </View>
          ) : null}
        </View>

        {child.age != null && (
          <View style={styles.ageBadge}>
            <Text style={styles.ageBadgeText}>Age {child.age}</Text>
          </View>
        )}
      </View>

      <View style={styles.statsGrid}>
        {[
          { value: child.totalGoals, label: 'Goals' },
          { value: child.totalAssists, label: 'Assists' },
          { value: child.matchesPlayed, label: 'Matches' },
          { value: child.averageRating != null ? child.averageRating.toFixed(1) : '—', label: 'Rating' },
        ].map((stat, index) => (
          <View key={index} style={styles.statBox}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.viewProfileBtn} onPress={onViewProfile} activeOpacity={0.85}>
        <Text style={styles.viewProfileBtnText}>View Full Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

function ConsentRequestCard({ request, onApprove, onReject, submitting }) {
  const initials = (request.athleteName || '?')
    .split(' ')
    .map(part => part[0])
    .join('');

  const formattedDate = formatOfferDate(request.eventDate);

  return (
    <View style={styles.consentCard}>
      <View style={styles.consentCardTop}>
        <View style={[styles.consentAvatar, { backgroundColor: '#06B6D4' }]}>
          <Text style={styles.consentAvatarText}>{initials}</Text>
        </View>

        <View style={styles.consentContent}>
          <View style={styles.consentNameRow}>
            <Text style={styles.consentName}>{request.athleteName}</Text>
            <Text style={styles.consentDate}>{request.dateSent?.slice(0, 10)}</Text>
          </View>

          <View style={[styles.consentBadge, { backgroundColor: '#ECFEFF', borderColor: '#CFFAFE' }]}>
            <Text style={[styles.consentBadgeText, { color: '#0891B2' }]}>Recruitment Consent</Text>
          </View>

          <Text style={styles.consentFrom}>
            <Text style={styles.consentFromLabel}>From: </Text>
            {request.scoutName}{request.scoutOrganization ? ` (${request.scoutOrganization})` : ''}
          </Text>

          {request.title ? (
            <Text style={styles.offerTitle}>{request.title}</Text>
          ) : null}

          {(formattedDate || request.location) ? (
            <View style={styles.offerMetaRow}>
              {formattedDate ? (
                <View style={styles.offerMetaItem}>
                  <Ionicons name="calendar-outline" size={13} color="#6B7280" />
                  <Text style={styles.offerMetaText}>{formattedDate}</Text>
                </View>
              ) : null}
              {request.location ? (
                <View style={styles.offerMetaItem}>
                  <Ionicons name="location-outline" size={13} color="#6B7280" />
                  <Text style={styles.offerMetaText}>{request.location}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {request.attachmentUrl ? (
            <TouchableOpacity
              style={styles.viewDocLink}
              onPress={() => Linking.openURL(request.attachmentUrl).catch(() => {
                Alert.alert('Error', 'Could not open this document.');
              })}
              activeOpacity={0.75}
            >
              <Ionicons name="document-attach-outline" size={14} color="#06B6D4" />
              <Text style={styles.viewDocLinkText}>View attached document</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.consentActions}>
        <TouchableOpacity style={[styles.approveBtn, submitting && { opacity: 0.7 }]} onPress={onApprove} activeOpacity={0.85} disabled={submitting}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.approveBtnText}>Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.rejectBtn, submitting && { opacity: 0.7 }]} onPress={onReject} activeOpacity={0.85} disabled={submitting}>
          <Ionicons name="close-circle-outline" size={18} color="#374151" />
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SignupConsentCard({ request, onApprove, onReject, submitting }) {
  const initials = (request.athleteName || '?')
    .split(' ')
    .map(part => part[0])
    .join('');

  return (
    <View style={styles.consentCard}>
      <View style={styles.consentCardTop}>
        <View style={[styles.consentAvatar, { backgroundColor: '#8B5CF6' }]}>
          <Text style={styles.consentAvatarText}>{initials}</Text>
        </View>

        <View style={styles.consentContent}>
          <View style={styles.consentNameRow}>
            <Text style={styles.consentName}>{request.athleteName}</Text>
            <Text style={styles.consentDate}>{request.dateRequested?.slice(0, 10)}</Text>
          </View>

          <View style={[styles.consentBadge, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
            <Text style={[styles.consentBadgeText, { color: '#7C3AED' }]}>New Account Request</Text>
          </View>

          <Text style={styles.consentDesc}>
            {request.athleteName} wants to join PrimeScout and needs your consent to create their account.
          </Text>
        </View>
      </View>

      <View style={styles.consentActions}>
        <TouchableOpacity style={[styles.approveBtn, submitting && { opacity: 0.7 }]} onPress={onApprove} activeOpacity={0.85} disabled={submitting}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.approveBtnText}>Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.rejectBtn, submitting && { opacity: 0.7 }]} onPress={onReject} activeOpacity={0.85} disabled={submitting}>
          <Ionicons name="close-circle-outline" size={18} color="#374151" />
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ActivityRow({ item }) {
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIcon, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={18} color={item.iconColor} />
      </View>

      <View style={styles.activityInfo}>
        <Text style={styles.activityText}>{item.text}</Text>
        {item.time ? <Text style={styles.activityTime}>{item.time}</Text> : null}
      </View>
    </View>
  );
}

export default function ParentDashboard({ navigation: navProp }) {
  const navHook = useNavigation();
  const navigation = navProp || navHook;

  const [activeTab, setActiveTab] = useState('home');

  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [consentRequests, setConsentRequests] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  const [signupRequests, setSignupRequests] = useState([]);
  const [respondingSignupId, setRespondingSignupId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingChild, setLoadingChild] = useState(false);

  const goTo = (screen, params) => navigation.navigate(screen, params);

  const loadSignupRequests = useCallback(async () => {
    try {
      const res = await api.get('/api/Parent/signup-consent-requests');
      setSignupRequests(res.data);
    } catch (err) {
      console.error('Failed to load signup consent requests:', err);
    }
  }, []);

  const loadChildren = useCallback(async () => {
    try {
      const res = await api.get('/api/Parent/children');
      setChildren(res.data);

      if (res.data.length > 0) {
        setSelectedChildId(res.data[0].athleteId);
      }
    } catch (err) {
      console.error('Failed to load children:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
    loadSignupRequests();
  }, [loadChildren, loadSignupRequests]);

  const loadChildDetails = useCallback(async (athleteId) => {
    setLoadingChild(true);
    try {
      const [summaryRes, athleteRes, consentRes] = await Promise.all([
        api.get(`/api/Parent/children/${athleteId}`),
        api.get(`/api/Athlete/GetAthleteById/${athleteId}`),
        api.get(`/api/Parent/children/${athleteId}/consent-requests`),
      ]);

      setSelectedChild({
        ...summaryRes.data,
        age: calculateAge(athleteRes.data.dateOfBirth),
        verified: athleteRes.data.verified,
      });
      setConsentRequests(consentRes.data);
    } catch (err) {
      console.error('Failed to load child details:', err);
    } finally {
      setLoadingChild(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadChildDetails(selectedChildId);
    }
  }, [selectedChildId, loadChildDetails]);

  const handleApprove = (offerId) => {
    Alert.alert('Approve Request', 'Are you sure you want to approve this consent request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setRespondingId(offerId);
          try {
            await api.put(`/api/Parent/consent-requests/${offerId}`, { approve: true });
            setConsentRequests((prev) => prev.filter((r) => r.offerId !== offerId));
            Alert.alert('Approved', 'Consent request has been approved.');
          } catch (err) {
            Alert.alert('Error', 'Could not approve this request.');
          } finally {
            setRespondingId(null);
          }
        },
      },
    ]);
  };

  const handleReject = (offerId) => {
    Alert.alert('Reject Request', 'Are you sure you want to reject this consent request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setRespondingId(offerId);
          try {
            await api.put(`/api/Parent/consent-requests/${offerId}`, { approve: false });
            setConsentRequests((prev) => prev.filter((r) => r.offerId !== offerId));
            Alert.alert('Rejected', 'Consent request has been rejected.');
          } catch (err) {
            Alert.alert('Error', 'Could not reject this request.');
          } finally {
            setRespondingId(null);
          }
        },
      },
    ]);
  };

  const handleApproveSignup = (requestId) => {
    Alert.alert('Approve Account', 'Approve this new account request? Your child will be able to log in once approved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setRespondingSignupId(requestId);
          try {
            await api.put(`/api/Parent/signup-consent-requests/${requestId}`, { approve: true });
            setSignupRequests((prev) => prev.filter((r) => r.requestId !== requestId));
            Alert.alert('Approved', "Your child's account has been approved.");
            loadChildren(); // the newly-approved athlete now shows up as a linked child
          } catch (err) {
            Alert.alert('Error', 'Could not approve this request.');
          } finally {
            setRespondingSignupId(null);
          }
        },
      },
    ]);
  };

  const handleRejectSignup = (requestId) => {
    Alert.alert('Reject Account', 'Are you sure you want to reject this account request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setRespondingSignupId(requestId);
          try {
            await api.put(`/api/Parent/signup-consent-requests/${requestId}`, { approve: false });
            setSignupRequests((prev) => prev.filter((r) => r.requestId !== requestId));
            Alert.alert('Rejected', 'The account request has been rejected.');
          } catch (err) {
            Alert.alert('Error', 'Could not reject this request.');
          } finally {
            setRespondingSignupId(null);
          }
        },
      },
    ]);
  };

  const handleTabPress = tab => {
    setActiveTab(tab);
    if (tab === 'messages') goTo('Messages');
    if (tab === 'me') goTo('Profile');
  };

  const handleViewChildProfile = () => {
    if (!selectedChild?.athleteId) return;
    navigation.navigate('PublicProfile', { type: 'Athlete', id: selectedChild.athleteId });
  };

  const handleNotifications = () => goTo('Notifications');
  const handleSettings = () => goTo('Settings');

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PRIME SCOUT</Text>
          <Text style={styles.headerSubtitle}>Parent Dashboard</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleNotifications} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color="#374151" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => handleTabPress('messages')} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#374151" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={handleSettings} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {signupRequests.length > 0 && (
          <View style={{ marginBottom: responsive(20) }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Account Requests</Text>
              <View style={styles.pendingCountBadge}>
                <Text style={styles.pendingCountText}>{signupRequests.length} pending</Text>
              </View>
            </View>

            <View style={styles.consentList}>
              {signupRequests.map(request => (
                <SignupConsentCard
                  key={request.requestId}
                  request={request}
                  submitting={respondingSignupId === request.requestId}
                  onApprove={() => handleApproveSignup(request.requestId)}
                  onReject={() => handleRejectSignup(request.requestId)}
                />
              ))}
            </View>
          </View>
        )}

        {children.length === 0 ? (
          <View style={styles.emptyConsent}>
            <Ionicons name="person-add-outline" size={52} color="#9CA3AF" />
            <Text style={styles.emptyConsentTitle}>No linked children yet</Text>
            <Text style={styles.emptyConsentSub}>
              Once your child links their account to you, they'll appear here.
            </Text>
          </View>
        ) : (
          <>
            {children.length > 1 && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: responsive(16), flexWrap: 'wrap' }}>
                {children.map((c) => (
                  <TouchableOpacity
                    key={c.athleteId}
                    onPress={() => setSelectedChildId(c.athleteId)}
                    style={[
                      styles.ageBadge,
                      { alignSelf: 'flex-start' },
                      selectedChildId === c.athleteId && { backgroundColor: '#06B6D4' },
                    ]}
                  >
                    <Text style={[styles.ageBadgeText, selectedChildId === c.athleteId && { color: '#ffffff' }]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {loadingChild || !selectedChild ? (
              <ActivityIndicator size="large" color="#06B6D4" style={{ marginVertical: 24 }} />
            ) : (
              <>
                <ChildProfileCard child={selectedChild} onViewProfile={handleViewChildProfile} />

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Consent Requests</Text>

                  {consentRequests.length > 0 && (
                    <View style={styles.pendingCountBadge}>
                      <Text style={styles.pendingCountText}>{consentRequests.length} pending</Text>
                    </View>
                  )}
                </View>

                {consentRequests.length === 0 ? (
                  <View style={styles.emptyConsent}>
                    <Ionicons name="checkmark-circle" size={52} color="#22C55E" />
                    <Text style={styles.emptyConsentTitle}>No pending consent requests</Text>
                    <Text style={styles.emptyConsentSub}>You're all caught up!</Text>
                  </View>
                ) : (
                  <View style={styles.consentList}>
                    {consentRequests.map(request => (
                      <ConsentRequestCard
                        key={request.offerId}
                        request={request}
                        submitting={respondingId === request.offerId}
                        onApprove={() => handleApprove(request.offerId)}
                        onReject={() => handleReject(request.offerId)}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}

        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          <View style={styles.activityList}>
            {RECENT_ACTIVITY.map(item => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </View>
        </View>

        <View style={styles.safetyCard}>
          <View style={styles.safetyCardRow}>
            <View style={styles.safetyIconCircle}>
              <Ionicons name="shield-checkmark" size={22} color="#0891B2" />
            </View>

            <View style={styles.safetyInfo}>
              <Text style={styles.safetyTitle}>Your child is protected</Text>

              <Text style={styles.safetySub}>
                All scout recruitment offers require your consent before proceeding.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        {[
          { tab: 'home', icon: 'home-outline', iconActive: 'home', label: 'Home', badge: false },
          { tab: 'messages', icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses', label: 'Messages', badge: false },
          { tab: 'me', icon: 'person-outline', iconActive: 'person', label: 'Me', badge: false },
        ].map(item => (
          <TouchableOpacity key={item.tab} style={styles.navTab} onPress={() => handleTabPress(item.tab)} activeOpacity={0.7}>
            <View style={styles.navIconWrapper}>
              <Ionicons name={activeTab === item.tab ? item.iconActive : item.icon} size={24} color={activeTab === item.tab ? '#06B6D4' : '#6B7280'} />
              {item.badge && <View style={styles.navBadgeDot} />}
            </View>

            <Text style={[styles.navLabel, activeTab === item.tab && styles.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  headerTitle: {
    fontSize: responsive(20),
    fontWeight: '800',
    color: '#000000',
  },

  headerSubtitle: {
    fontSize: responsive(12),
    color: '#6B7280',
    marginTop: 2,
  },

  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(4),
  },

  iconBtn: {
    padding: responsive(8),
    borderRadius: responsive(8),
    position: 'relative',
  },

  badgeDot: {
    position: 'absolute',
    top: responsive(6),
    right: responsive(6),
    width: responsive(8),
    height: responsive(8),
    borderRadius: responsive(4),
    backgroundColor: '#EF4444',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: responsive(16),
    paddingBottom: responsive(32),
  },

  childCard: {
    backgroundColor: '#ffffff',
    borderRadius: responsive(20),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: responsive(16),
    marginBottom: responsive(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  childCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsive(14),
  },

  childCardTitle: {
    fontSize: responsive(16),
    fontWeight: '700',
    color: '#000000',
  },

  childInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsive(12),
  },

  childAvatar: {
    width: responsive(60),
    height: responsive(60),
    borderRadius: responsive(30),
    alignItems: 'center',
    justifyContent: 'center',
  },

  childAvatarText: {
    fontSize: responsive(18),
    fontWeight: '800',
    color: '#ffffff',
  },

  childInfo: {
    flex: 1,
    marginLeft: responsive(12),
  },

  childName: {
    fontSize: responsive(17),
    fontWeight: '700',
    color: '#000000',
    marginBottom: responsive(2),
  },

  childSport: {
    fontSize: responsive(13),
    color: '#374151',
    marginBottom: responsive(3),
  },

  childLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(3),
  },

  childLocation: {
    fontSize: responsive(12),
    color: '#6B7280',
  },

  ageBadge: {
    backgroundColor: '#ECFEFF',
    borderRadius: responsive(12),
    paddingHorizontal: responsive(10),
    paddingVertical: responsive(4),
    alignSelf: 'flex-start',
  },

  ageBadgeText: {
    fontSize: responsive(12),
    fontWeight: '600',
    color: '#0891B2',
  },

  teamRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsive(12),
    marginBottom: responsive(14),
    paddingHorizontal: responsive(4),
  },

  teamInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(5),
  },

  teamInfoText: {
    fontSize: responsive(12),
    color: '#6B7280',
  },

  statsGrid: {
    flexDirection: 'row',
    gap: responsive(8),
    marginBottom: responsive(16),
  },

  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: responsive(10),
    paddingVertical: responsive(10),
    alignItems: 'center',
  },

  statValue: {
    fontSize: responsive(18),
    fontWeight: '700',
    color: '#000000',
  },

  statLabel: {
    fontSize: responsive(11),
    color: '#6B7280',
    marginTop: responsive(2),
  },

  viewProfileBtn: {
    backgroundColor: '#06B6D4',
    borderRadius: responsive(24),
    paddingVertical: responsive(14),
    alignItems: 'center',
  },

  viewProfileBtnText: {
    fontSize: responsive(15),
    fontWeight: '600',
    color: '#ffffff',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsive(12),
  },

  sectionTitle: {
    fontSize: responsive(16),
    fontWeight: '700',
    color: '#000000',
  },

  pendingCountBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: responsive(12),
    paddingHorizontal: responsive(10),
    paddingVertical: responsive(4),
  },

  pendingCountText: {
    fontSize: responsive(12),
    fontWeight: '600',
    color: '#B45309',
  },

  emptyConsent: {
    backgroundColor: '#ffffff',
    borderRadius: responsive(20),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: responsive(40),
    alignItems: 'center',
    marginBottom: responsive(20),
  },

  emptyConsentTitle: {
    fontSize: responsive(15),
    fontWeight: '600',
    color: '#374151',
    marginTop: responsive(12),
  },

  emptyConsentSub: {
    fontSize: responsive(13),
    color: '#9CA3AF',
    marginTop: responsive(4),
  },

  consentList: {
    gap: responsive(14),
    marginBottom: responsive(20),
  },

  consentCard: {
    backgroundColor: '#ffffff',
    borderRadius: responsive(20),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: responsive(16),
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  consentCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsive(14),
  },

  consentAvatar: {
    width: responsive(48),
    height: responsive(48),
    borderRadius: responsive(24),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  consentAvatarText: {
    fontSize: responsive(15),
    fontWeight: '700',
    color: '#ffffff',
  },

  consentContent: {
    flex: 1,
    marginLeft: responsive(12),
  },

  consentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsive(6),
    gap: responsive(8),
  },

  consentName: {
    flex: 1,
    fontSize: responsive(15),
    fontWeight: '700',
    color: '#000000',
  },

  consentDate: {
    fontSize: responsive(11),
    color: '#9CA3AF',
  },

  consentBadge: {
    alignSelf: 'flex-start',
    borderRadius: responsive(12),
    borderWidth: 1,
    paddingHorizontal: responsive(10),
    paddingVertical: responsive(4),
    marginBottom: responsive(8),
  },

  consentBadgeText: {
    fontSize: responsive(12),
    fontWeight: '600',
  },

  consentFrom: {
    fontSize: responsive(13),
    color: '#6B7280',
    marginBottom: responsive(6),
  },

  consentFromLabel: {
    fontWeight: '600',
    color: '#374151',
  },

  consentDesc: {
    fontSize: responsive(13),
    color: '#374151',
    lineHeight: responsive(19),
  },

  offerTitle: {
    fontSize: responsive(14),
    fontWeight: '700',
    color: '#000000',
    marginBottom: responsive(6),
  },

  offerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsive(12),
    marginBottom: responsive(8),
  },

  offerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(4),
  },

  offerMetaText: {
    fontSize: responsive(12),
    color: '#6B7280',
  },

  viewDocLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(5),
    alignSelf: 'flex-start',
  },

  viewDocLinkText: {
    fontSize: responsive(12),
    fontWeight: '600',
    color: '#06B6D4',
  },

  consentActions: {
    flexDirection: 'row',
    gap: responsive(10),
  },

  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive(6),
    backgroundColor: '#06B6D4',
    borderRadius: responsive(24),
    paddingVertical: responsive(13),
  },

  approveBtnText: {
    fontSize: responsive(14),
    fontWeight: '600',
    color: '#ffffff',
  },

  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive(6),
    backgroundColor: '#F3F4F6',
    borderRadius: responsive(24),
    paddingVertical: responsive(13),
  },

  rejectBtnText: {
    fontSize: responsive(14),
    fontWeight: '600',
    color: '#374151',
  },

  activitySection: {
    backgroundColor: '#ffffff',
    borderRadius: responsive(20),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: responsive(16),
    marginBottom: responsive(16),
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  activityList: {
    gap: responsive(16),
    marginTop: responsive(12),
  },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  activityIcon: {
    width: responsive(40),
    height: responsive(40),
    borderRadius: responsive(20),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  activityInfo: {
    flex: 1,
    marginLeft: responsive(12),
  },

  activityText: {
    fontSize: responsive(14),
    color: '#374151',
    lineHeight: responsive(20),
  },

  activityTime: {
    fontSize: responsive(12),
    color: '#9CA3AF',
    marginTop: responsive(2),
  },

  safetyCard: {
    backgroundColor: '#ECFEFF',
    borderRadius: responsive(16),
    borderWidth: 1,
    borderColor: '#CFFAFE',
    padding: responsive(16),
    marginBottom: responsive(8),
  },

  safetyCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  safetyIconCircle: {
    width: responsive(44),
    height: responsive(44),
    borderRadius: responsive(22),
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  safetyInfo: {
    flex: 1,
    marginLeft: responsive(12),
  },

  safetyTitle: {
    fontSize: responsive(14),
    fontWeight: '700',
    color: '#0891B2',
    marginBottom: responsive(4),
  },

  safetySub: {
    fontSize: responsive(13),
    color: '#0891B2',
    lineHeight: responsive(19),
  },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: responsive(8),
    paddingBottom: Platform.OS === 'ios' ? responsive(20) : responsive(8),
    paddingHorizontal: responsive(8),
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  navTab: {
    flex: 1,
    alignItems: 'center',
    gap: responsive(4),
    paddingVertical: responsive(4),
  },

  navIconWrapper: {
    position: 'relative',
  },

  navBadgeDot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: responsive(8),
    height: responsive(8),
    borderRadius: responsive(4),
    backgroundColor: '#EF4444',
  },

  navLabel: {
    fontSize: responsive(11),
    fontWeight: '500',
    color: '#6B7280',
  },

  navLabelActive: {
    color: '#06B6D4',
  },
});