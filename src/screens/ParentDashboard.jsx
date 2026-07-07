import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const scale = SCREEN_WIDTH / 390;
const responsive = size => Math.round(size * Math.min(scale, 1.18));

const CHILD_PROFILE = {
  name: 'Themba Nkosi',
  sport: 'Football',
  position: 'Midfielder',
  location: 'Johannesburg, South Africa',
  age: 16,
  team: 'Johannesburg Youth Academy',
  coachName: 'Coach Mbeki',
  verified: true,
  goals: 18,
  assists: 12,
  matches: 24,
  rating: 8.5,
  coverImage:
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  profileImage:
    'https://images.unsplash.com/photo-1578479161055-9d2d985e2de0?w=400&q=80',
  about:
    'Talented midfielder with exceptional ball control and passing accuracy. Currently playing for Johannesburg Youth Academy with strong prospects for professional advancement.',
};

const CONSENT_BADGE_COLORS = {
  'Profile Access': {
    bg: '#ECFEFF',
    text: '#0891B2',
    border: '#CFFAFE',
  },
  'Video Access': {
    bg: '#F5F3FF',
    text: '#7C3AED',
    border: '#EDE9FE',
  },
  'Contact Information': {
    bg: '#F0FDF4',
    text: '#16A34A',
    border: '#DCFCE7',
  },
};

const RECENT_ACTIVITY = [
  {
    id: 'act1',
    icon: 'checkmark-circle',
    iconColor: '#16A34A',
    iconBg: '#F0FDF4',
    text: "Coach Mbeki verified Themba's stats",
    time: '2h ago',
  },
  {
    id: 'act2',
    icon: 'videocam-outline',
    iconColor: '#7C3AED',
    iconBg: '#F5F3FF',
    text: 'Themba uploaded a new highlight video',
    time: '1d ago',
  },
  {
    id: 'act3',
    icon: 'star-outline',
    iconColor: '#D97706',
    iconBg: '#FFFBEB',
    text: 'New recruitment interest from Cape Town FC',
    time: '3d ago',
  },
  {
    id: 'act4',
    icon: 'trophy-outline',
    iconColor: '#0891B2',
    iconBg: '#ECFEFF',
    text: 'Johannesburg Youth Academy won 3-1 vs Durban FC',
    time: '4d ago',
  },
];

function ChildProfileCard({ child, onViewProfile }) {
  return (
    <View style={styles.childCard}>
      <View style={styles.childCardHeader}>
        <Text style={styles.childCardTitle}>Your Child's Profile</Text>
        {child.verified && (
          <Ionicons name="checkmark-circle" size={20} color="#06B6D4" />
        )}
      </View>

      <View style={styles.childInfoRow}>
        <LinearGradient
          colors={['#06B6D4', '#3B82F6']}
          style={styles.childAvatar}
        >
          <Text style={styles.childAvatarText}>
            {child.name
              .split(' ')
              .map(part => part[0])
              .join('')}
          </Text>
        </LinearGradient>

        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.name}</Text>

          <Text style={styles.childSport}>
            {child.sport} • {child.position}
          </Text>

          <View style={styles.childLocationRow}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.childLocation}>{child.location}</Text>
          </View>
        </View>

        <View style={styles.ageBadge}>
          <Text style={styles.ageBadgeText}>Age {child.age}</Text>
        </View>
      </View>

      <View style={styles.teamRow}>
        <View style={styles.teamInfoItem}>
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text style={styles.teamInfoText}>{child.team}</Text>
        </View>

        <View style={styles.teamInfoItem}>
          <Ionicons name="person-outline" size={14} color="#6B7280" />
          <Text style={styles.teamInfoText}>{child.coachName}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {[
          { value: child.goals, label: 'Goals' },
          { value: child.assists, label: 'Assists' },
          { value: child.matches, label: 'Matches' },
          { value: child.rating, label: 'Rating' },
        ].map((stat, index) => (
          <View key={index} style={styles.statBox}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.viewProfileBtn}
        onPress={onViewProfile}
        activeOpacity={0.85}
      >
        <Text style={styles.viewProfileBtnText}>View Full Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

function ConsentTypeBadge({ type }) {
  const colors = CONSENT_BADGE_COLORS[type] ?? {
    bg: '#F3F4F6',
    text: '#374151',
    border: '#E5E7EB',
  };

  return (
    <View
      style={[
        styles.consentBadge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.consentBadgeText, { color: colors.text }]}>
        {type}
      </Text>
    </View>
  );
}

function ConsentRequestCard({ request, onApprove, onReject }) {
  return (
    <View style={styles.consentCard}>
      <View style={styles.consentCardTop}>
        <View
          style={[
            styles.consentAvatar,
            { backgroundColor: request.avatarColor },
          ]}
        >
          <Text style={styles.consentAvatarText}>{request.avatar}</Text>
        </View>

        <View style={styles.consentContent}>
          <View style={styles.consentNameRow}>
            <Text style={styles.consentName}>{request.name}</Text>
            <Text style={styles.consentDate}>{request.date}</Text>
          </View>

          <ConsentTypeBadge type={request.type} />

          <Text style={styles.consentFrom}>
            <Text style={styles.consentFromLabel}>From: </Text>
            {request.from}
          </Text>

          <Text style={styles.consentDesc}>{request.description}</Text>
        </View>
      </View>

      <View style={styles.consentActions}>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={onApprove}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.approveBtnText}>Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={onReject}
          activeOpacity={0.85}
        >
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
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
    </View>
  );
}

export default function ParentDashboard({ onNavigate, onLogout }) {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('home');

  const [consentRequests, setConsentRequests] = useState([
    {
      id: '1',
      name: 'Alex Johnson',
      date: 'May 16, 2026',
      type: 'Profile Access',
      from: 'Manchester United Scout',
      description:
        'Wants to view full athletic profile and performance statistics',
      avatar: 'AJ',
      avatarColor: '#06B6D4',
    },
    {
      id: '2',
      name: 'Sarah Williams',
      date: 'May 15, 2026',
      type: 'Video Access',
      from: 'Coach Martinez',
      description: 'Requesting access to training videos and match highlights',
      avatar: 'SW',
      avatarColor: '#7C3AED',
    },
    {
      id: '3',
      name: 'Alex Johnson',
      date: 'May 14, 2026',
      type: 'Contact Information',
      from: 'FC Barcelona Recruiter',
      description: 'Wants to schedule an in-person evaluation meeting',
      avatar: 'AJ',
      avatarColor: '#16A34A',
    },
  ]);

  const goTo = (screen, params) => {
    if (onNavigate) {
      onNavigate(screen, params);
    } else {
      navigation.navigate(screen, params);
    }
  };

  const handleApprove = id => {
    Alert.alert(
      'Approve Request',
      'Are you sure you want to approve this consent request?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            setConsentRequests(prev =>
              prev.filter(request => request.id !== id)
            );
            Alert.alert('Approved', 'Consent request has been approved.');
          },
        },
      ]
    );
  };

  const handleReject = id => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this consent request?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setConsentRequests(prev =>
              prev.filter(request => request.id !== id)
            );
            Alert.alert('Rejected', 'Consent request has been rejected.');
          },
        },
      ]
    );
  };

  const handleTabPress = tab => {
    setActiveTab(tab);

    if (tab === 'messages') {
      goTo('Messages');
    }

    if (tab === 'child') {
      Alert.alert('Child Profile', 'Child profile screen is coming soon.');
    }
  };

  const handleViewChildProfile = () => {
    Alert.alert('Child Profile', 'Child profile screen is coming soon.');
  };

  const handleNotifications = () => {
    goTo('Notifications');
  };

  const handleSettings = () => {
    goTo('Settings');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PRIME SCOUT</Text>
          <Text style={styles.headerSubtitle}>Parent Dashboard</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleNotifications}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color="#374151"
            />
            <View style={styles.badgeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleTabPress('messages')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color="#374151"
            />
            <View style={styles.badgeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleSettings}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ChildProfileCard
          child={CHILD_PROFILE}
          onViewProfile={handleViewChildProfile}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Consent Requests</Text>

          {consentRequests.length > 0 && (
            <View style={styles.pendingCountBadge}>
              <Text style={styles.pendingCountText}>
                {consentRequests.length} pending
              </Text>
            </View>
          )}
        </View>

        {consentRequests.length === 0 ? (
          <View style={styles.emptyConsent}>
            <Ionicons name="checkmark-circle" size={52} color="#22C55E" />

            <Text style={styles.emptyConsentTitle}>
              No pending consent requests
            </Text>

            <Text style={styles.emptyConsentSub}>You're all caught up!</Text>
          </View>
        ) : (
          <View style={styles.consentList}>
            {consentRequests.map(request => (
              <ConsentRequestCard
                key={request.id}
                request={request}
                onApprove={() => handleApprove(request.id)}
                onReject={() => handleReject(request.id)}
              />
            ))}
          </View>
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
                All scout and coach interactions require your consent. You
                control who can access Themba's profile.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        {[
          {
            tab: 'home',
            icon: 'home-outline',
            iconActive: 'home',
            label: 'Home',
            badge: false,
          },
          {
            tab: 'messages',
            icon: 'chatbubble-ellipses-outline',
            iconActive: 'chatbubble-ellipses',
            label: 'Messages',
            badge: true,
          },
          {
            tab: 'child',
            icon: 'person-outline',
            iconActive: 'person',
            label: 'Child',
            badge: false,
          },
        ].map(item => (
          <TouchableOpacity
            key={item.tab}
            style={styles.navTab}
            onPress={() => handleTabPress(item.tab)}
            activeOpacity={0.7}
          >
            <View style={styles.navIconWrapper}>
              <Ionicons
                name={activeTab === item.tab ? item.iconActive : item.icon}
                size={24}
                color={activeTab === item.tab ? '#06B6D4' : '#6B7280'}
              />

              {item.badge && <View style={styles.navBadgeDot} />}
            </View>

            <Text
              style={[
                styles.navLabel,
                activeTab === item.tab && styles.navLabelActive,
              ]}
            >
              {item.label}
            </Text>
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
    marginBottom: responsive(4),
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