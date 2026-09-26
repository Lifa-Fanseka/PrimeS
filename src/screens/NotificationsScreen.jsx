import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  pinkBg: '#FDF2F8',
  pinkIcon: '#EC4899',
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
  grayBg: '#F3F4F6',
  grayIcon: '#6B7280',
  redDot: '#EF4444',
};

// Maps directly to the "Type" strings the backend actually creates
// (see NotificationService.CreateAsync calls across MediaController,
// StatisticsController, MatchController, ChatHub, ParentController,
// ScoutController).
const TYPE_CONFIG = {
  Like: { iconName: 'heart', bg: COLORS.pinkBg, color: COLORS.pinkIcon, label: 'Likes' },
  Comment: { iconName: 'message-square', bg: COLORS.blueBg, color: COLORS.blueIcon, label: 'Comments' },
  MediaVerification: { iconName: 'video', bg: COLORS.purpleBg, color: COLORS.purpleIcon, label: 'Media' },
  StatsVerification: { iconName: 'check-circle', bg: COLORS.greenBg, color: COLORS.greenIcon, label: 'Stats' },
  MatchResult: { iconName: 'calendar', bg: COLORS.orangeBg, color: COLORS.orangeIcon, label: 'Matches' },
  Message: { iconName: 'message-circle', bg: COLORS.blueBg, color: COLORS.blueIcon, label: 'Messages' },
  ConsentResponse: { iconName: 'shield', bg: COLORS.cyanBg, color: COLORS.cyanIcon, label: 'Consent' },
  RecruitmentOffer: { iconName: 'award', bg: COLORS.orangeBg, color: COLORS.orangeIcon, label: 'Offers' },
  RecruitmentOfferResponse: { iconName: 'award', bg: COLORS.orangeBg, color: COLORS.orangeIcon, label: 'Offers' },
};

const DEFAULT_TYPE_CONFIG = {
  iconName: 'bell',
  bg: COLORS.grayBg,
  color: COLORS.grayIcon,
  label: 'Other',
};

const FILTER_TABS = ['All', 'Unread', 'Likes', 'Comments', 'Stats', 'Matches', 'Messages', 'Consent', 'Offers'];

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myRole, setMyRole] = useState(null);

  const animatedValues = useRef({});

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/Notification/me');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('role').then(setMyRole);
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Unread') return !n.isRead;
      const config = TYPE_CONFIG[n.type] || DEFAULT_TYPE_CONFIG;
      return config.label === activeFilter;
    });
  }, [notifications, activeFilter]);

  const getAnimValue = (id) => {
    if (!animatedValues.current[id]) {
      animatedValues.current[id] = new Animated.Value(1);
    }
    return animatedValues.current[id];
  };

  const handleView = async (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === notif.notificationId ? { ...n, isRead: true } : n))
    );

    try {
      await api.put(`/api/Notification/${notif.notificationId}/read`);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }

    // RelatedId on a Message notification is the sender's UserId (see ChatHub.SendMessage).
    if (notif.type === 'Message' && notif.relatedId) {
      navigation.navigate('Messages', { recipientId: notif.relatedId });
      return;
    }

    // RelatedId on a RecruitmentOffer / RecruitmentOfferResponse
    // notification is the OfferId (see ScoutController.SendOffer and
    // ParentController.RespondToConsentRequest). The SAME "RecruitmentOffer"
    // type is sent to both the athlete and — for a minor — their parent,
    // so where this actually navigates depends on who's tapping it:
    // the athlete has their own offer-detail screen, but the parent's
    // equivalent screen isn't built yet, so they land on their dashboard
    // for now rather than nowhere at all.
    if ((notif.type === 'RecruitmentOffer' || notif.type === 'RecruitmentOfferResponse') && notif.relatedId) {
      if (myRole === 'Athlete') {
        navigation.navigate('OfferDetail', { offerId: notif.relatedId });
      } else if (myRole === 'Parent') {
        navigation.navigate('ParentDashboard');
      }
      return;
    }
  };

  const handleDismiss = (notif) => {
    const anim = getAnimValue(notif.notificationId);

    Animated.timing(anim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      setNotifications((prev) => prev.filter((n) => n.notificationId !== notif.notificationId));
      try {
        await api.delete(`/api/Notification/${notif.notificationId}`);
      } catch (err) {
        console.error('Failed to dismiss notification:', err);
      }
    });
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      // No bulk "mark all read" endpoint exists yet — loop individual calls.
      await Promise.all(
        unread.map((n) => api.put(`/api/Notification/${n.notificationId}/read`))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const renderItem = useCallback(
    ({ item }) => {
      const anim = getAnimValue(item.notificationId);

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
            onView={() => handleView(item)}
            onDismiss={() => handleDismiss(item)}
          />
        </Animated.View>
      );
    },
    [notifications, myRole]
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerLoading]}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
      </SafeAreaView>
    );
  }

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
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>

                {showUnreadBadge && (
                  <View style={[styles.unreadTabBadge, active && styles.unreadTabBadgeActive]}>
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
        keyExtractor={(item) => String(item.notificationId)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState activeFilter={activeFilter} />}
      />
    </SafeAreaView>
  );
}

function NotificationCard({ notification, onView, onDismiss }) {
  const config = TYPE_CONFIG[notification.type] || DEFAULT_TYPE_CONFIG;
  const unread = !notification.isRead;

  return (
    <View style={styles.card}>
      {unread && <View style={styles.leftAccent} />}
      {unread && <View style={styles.unreadDot} />}

      <View style={styles.cardContent}>
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
            <Feather name={config.iconName} size={22} color={config.color} />
          </View>

          <View style={styles.textColumn}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.cardTitle}>
              {notification.title}
            </Text>

            <Text numberOfLines={3} ellipsizeMode="tail" style={styles.description}>
              {notification.message}
            </Text>

            <Text style={styles.timeText}>{formatTimeAgo(notification.dateCreated)}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity activeOpacity={0.75} style={[styles.viewButton, !unread && styles.viewButtonRead]} onPress={onView}>
            <Text style={[styles.viewButtonText, !unread && styles.viewButtonTextRead]}>{unread ? 'Mark as Read' : 'Read'}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.75} style={styles.dismissButton} onPress={onDismiss}>
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
  safeArea: { flex: 1, backgroundColor: COLORS.gray50 },
  centerLoading: { alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: COLORS.black },

  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryText: { fontSize: 13, fontWeight: '600' },
  unreadSummary: { color: COLORS.cyan },
  caughtUpSummary: { color: COLORS.gray400 },
  markReadText: { fontSize: 13, color: COLORS.gray500, fontWeight: '500' },

  tabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },

  tabsContent: { paddingHorizontal: 12, paddingVertical: 10 },

  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    marginRight: 8,
  },

  tabChipActive: { backgroundColor: COLORS.cyan },
  tabText: { fontSize: 13, color: COLORS.gray600, fontWeight: '500' },
  tabTextActive: { color: COLORS.white, fontWeight: '600' },

  unreadTabBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.redDot,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  unreadTabBadgeActive: { backgroundColor: COLORS.white },
  unreadTabBadgeText: { fontSize: 9, fontWeight: '700', color: COLORS.white },
  unreadTabBadgeTextActive: { color: COLORS.cyan },

  listContent: { paddingTop: 12, paddingBottom: 32, flexGrow: 1 },

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

  cardContent: { padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textColumn: { flex: 1, paddingRight: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  description: { fontSize: 13, color: COLORS.gray700, lineHeight: 19, marginBottom: 6 },
  timeText: { fontSize: 11, color: COLORS.gray400, fontWeight: '400' },

  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  viewButton: {
    flex: 1,
    backgroundColor: COLORS.cyan,
    borderRadius: 20,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },

  viewButtonRead: {
    backgroundColor: COLORS.gray200,
  },

  viewButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  viewButtonTextRead: { color: COLORS.gray600 },

  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },

  dismissText: { fontSize: 13, color: COLORS.gray600, fontWeight: '500' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray500, marginTop: 12 },
  emptyText: {
    fontSize: 13,
    color: COLORS.gray400,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});