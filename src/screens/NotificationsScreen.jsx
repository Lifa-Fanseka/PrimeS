import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Animated,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

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

  purpleBg: '#F3E8FF',
  purpleIcon: '#A855F7',
  cyanBg: '#ECFEFF',
  cyanIcon: '#06B6D4',
  orangeBg: '#FFF7ED',
  orangeIcon: '#F97316',
  blueBg: '#EFF6FF',
  blueIcon: '#3B82F6',
  greenBg: '#F0FDF4',
  greenIcon: '#22C55E',
  yellowBg: '#FEFCE8',
  yellowIcon: '#CA8A04',
  redDot: '#EF4444',
};

const TYPE_CONFIG = {
  scouting: {
    iconName: 'user-plus',
    bg: COLORS.purpleBg,
    color: COLORS.purpleIcon,
    label: 'Scouting',
  },
  profile_view: {
    iconName: 'eye',
    bg: COLORS.cyanBg,
    color: COLORS.cyanIcon,
    label: 'Profile',
  },
  match_update: {
    iconName: 'calendar',
    bg: COLORS.orangeBg,
    color: COLORS.orangeIcon,
    label: 'Match',
  },
  message: {
    iconName: 'message-circle',
    bg: COLORS.blueBg,
    color: COLORS.blueIcon,
    label: 'Message',
  },
  stats_verified: {
    iconName: 'check-circle',
    bg: COLORS.greenBg,
    color: COLORS.greenIcon,
    label: 'Stats',
  },
  reminder: {
    iconName: 'bell',
    bg: COLORS.yellowBg,
    color: COLORS.yellowIcon,
    label: 'Reminder',
  },
};

const INITIAL_NOTIFICATIONS = [
  {
    id: '1',
    type: 'scouting',
    title: 'Scouting Request',
    description:
      'Manchester United Scout wants to view your full athletic profile and performance statistics',
    time: '2 minutes ago',
    unread: true,
    actionScreen: 'AthleteProfile',
  },
  {
    id: '2',
    type: 'profile_view',
    title: 'Scout Viewed Profile',
    description: 'Michael Rodriguez from FC Barcelona viewed your profile',
    time: '5 minutes ago',
    unread: true,
    actionScreen: 'AthleteProfile',
  },
  {
    id: '3',
    type: 'match_update',
    title: 'Match Update',
    description:
      'Your upcoming match vs Johannesburg FC has been rescheduled to May 20, 2026 at 15:00',
    time: '30 minutes ago',
    unread: true,
    actionScreen: null,
  },
  {
    id: '4',
    type: 'message',
    title: 'New Message',
    description: 'You have a new message from Coach Martinez',
    time: '1 hour ago',
    unread: true,
    actionScreen: 'Messages',
  },
  {
    id: '5',
    type: 'match_update',
    title: 'Match Result Posted',
    description: 'Coach Martinez posted match results: Won 3-1 vs Cape Town United',
    time: '2 hours ago',
    unread: false,
    actionScreen: null,
  },
  {
    id: '6',
    type: 'stats_verified',
    title: 'Stats Verified',
    description:
      'Your match statistics from May 10 have been verified by Coach Martinez',
    time: '3 hours ago',
    unread: false,
    actionScreen: null,
  },
  {
    id: '7',
    type: 'reminder',
    title: 'Training Session Reminder',
    description: 'Training session tomorrow at 14:00 - Stadium Field A',
    time: '5 hours ago',
    unread: false,
    actionScreen: null,
  },
  {
    id: '8',
    type: 'scouting',
    title: 'Recruitment Offer',
    description:
      'You have received a recruitment offer from FC Barcelona Recruiter. Parental consent required.',
    time: '1 day ago',
    unread: false,
    actionScreen: 'AthleteProfile',
  },
];

const FILTER_TABS = ['All', 'Unread', 'Scouting', 'Match', 'Message', 'Reminder'];

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('All');

  const animatedValues = useRef({});

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.unread).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Unread') return n.unread;
      return TYPE_CONFIG[n.type]?.label === activeFilter;
    });
  }, [notifications, activeFilter]);

  const getAnimValue = (id) => {
    if (!animatedValues.current[id]) {
      animatedValues.current[id] = new Animated.Value(1);
    }

    return animatedValues.current[id];
  };

  const handleView = (id) => {
    const notif = notifications.find((n) => n.id === id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );

    if (notif?.actionScreen === 'Messages') {
      navigation.navigate('Messages');
      return;
    }

    if (notif?.actionScreen === 'AthleteProfile') {
      Alert.alert('Coming Soon', 'Athlete profile screen is not created yet.');
      return;
    }
  };

  const handleDismiss = (id) => {
    const anim = getAnimValue(id);

    Animated.timing(anim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    });
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const renderItem = useCallback(
    ({ item }) => {
      const anim = getAnimValue(item.id);

      return (
        <Animated.View
          style={{
            opacity: anim,
            transform: [
              {
                translateX: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-40, 0],
                }),
              },
            ],
          }}
        >
          <NotificationCard
            notification={item}
            onView={() => handleView(item.id)}
            onDismiss={() => handleDismiss(item.id)}
          />
        </Animated.View>
      );
    },
    [notifications]
  );

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

          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text
            style={[
              styles.summaryText,
              unreadCount > 0 ? styles.unreadSummary : styles.caughtUpSummary,
            ]}
          >
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </Text>

          {unreadCount > 0 && (
            <TouchableOpacity activeOpacity={0.75} onPress={handleMarkAllRead}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab;
            const showUnreadBadge = tab === 'Unread' && unreadCount > 0;

            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.75}
                style={[styles.tabChip, active && styles.tabChipActive]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab}
                </Text>

                {showUnreadBadge && (
                  <View
                    style={[
                      styles.unreadTabBadge,
                      active && styles.unreadTabBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.unreadTabBadgeText,
                        active && styles.unreadTabBadgeTextActive,
                      ]}
                    >
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState activeFilter={activeFilter} />}
      />
    </SafeAreaView>
  );
}

function NotificationCard({ notification, onView, onDismiss }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.message;

  return (
    <View style={styles.card}>
      {notification.unread && <View style={styles.leftAccent} />}
      {notification.unread && <View style={styles.unreadDot} />}

      <View style={styles.cardContent}>
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
            <Feather name={config.iconName} size={22} color={config.color} />
          </View>

          <View style={styles.textColumn}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.cardTitle}>
              {notification.title}
            </Text>

            <Text
              numberOfLines={3}
              ellipsizeMode="tail"
              style={styles.description}
            >
              {notification.description}
            </Text>

            <Text style={styles.timeText}>{notification.time}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.viewButton}
            onPress={onView}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.dismissButton}
            onPress={onDismiss}
          >
            <Feather name="x" size={14} color={COLORS.gray500} />
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function EmptyState({ activeFilter }) {
  return (
    <View style={styles.emptyState}>
      <Feather name="bell-off" size={48} color={COLORS.gray300} />

      <Text style={styles.emptyTitle}>No notifications</Text>

      <Text style={styles.emptyText}>
        {activeFilter === 'Unread'
          ? "You're all caught up!"
          : `No ${activeFilter.toLowerCase()} notifications yet`}
      </Text>
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
    gap: 10,
    marginBottom: 8,
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

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryText: {
    fontSize: 13,
    fontWeight: '600',
  },

  unreadSummary: {
    color: COLORS.cyan,
  },

  caughtUpSummary: {
    color: COLORS.gray400,
  },

  markReadText: {
    fontSize: 13,
    color: COLORS.gray500,
    fontWeight: '500',
  },

  tabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },

  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    marginRight: 8,
  },

  tabChipActive: {
    backgroundColor: COLORS.cyan,
  },

  tabText: {
    fontSize: 13,
    color: COLORS.gray600,
    fontWeight: '500',
  },

  tabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

  unreadTabBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.redDot,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  unreadTabBadgeActive: {
    backgroundColor: COLORS.white,
  },

  unreadTabBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
  },

  unreadTabBadgeTextActive: {
    color: COLORS.cyan,
  },

  listContent: {
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },

  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.cyan,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },

  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cyan,
    zIndex: 5,
  },

  cardContent: {
    padding: 14,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textColumn: {
    flex: 1,
    paddingRight: 10,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },

  description: {
    fontSize: 13,
    color: COLORS.gray700,
    lineHeight: 19,
    marginBottom: 6,
  },

  timeText: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: '400',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  viewButton: {
    flex: 1,
    backgroundColor: COLORS.cyan,
    borderRadius: 20,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },

  viewButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },

  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },

  dismissText: {
    fontSize: 13,
    color: COLORS.gray600,
    fontWeight: '500',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray500,
    marginTop: 12,
  },

  emptyText: {
    fontSize: 13,
    color: COLORS.gray400,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});