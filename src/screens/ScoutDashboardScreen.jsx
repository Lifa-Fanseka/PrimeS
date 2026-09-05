import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 390;
const responsive = size => Math.round(size * Math.min(scale, 1.2));
const SPORTS = ['All Sports', 'Football', 'Basketball', 'Rugby', 'Track & Field'];
function DashboardStatCard({ icon, label, value, gradientStart, gradientEnd, iconColor }) {
  return (
    <LinearGradient
      colors={[gradientStart, gradientEnd]}
      style={styles.statCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Ionicons name={icon} size={24} color={iconColor} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );
}
function SportChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
function AthleteCard({ athlete, onFavorite, onViewProfile, onSendOffer }) {
  return (
    <View style={styles.athleteCard}>
      <View style={styles.athleteHeader}>
        {athlete.profilePhoto ? (
          <Image source={{ uri: athlete.profilePhoto }} style={styles.athleteAvatarImage} />
        ) : (
          <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.athleteAvatar}>
            <Text style={styles.avatarText}>{(athlete.name || '?').charAt(0)}</Text>
          </LinearGradient>
        )}
        <View style={styles.athleteInfo}>
          <View style={styles.athleteNameRow}>
            <Text style={styles.athleteName} numberOfLines={1}>
              {athlete.name}
            </Text>
            {athlete.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#06B6D4" style={styles.verifiedIcon} />
            )}
          </View>
          <Text style={styles.athleteSport}>
            {athlete.sport} • {athlete.position ?? '—'}
          </Text>
          <View style={styles.athleteMeta}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.athleteMetaText}>{athlete.region ?? 'Unknown'}</Text>
            <Ionicons name="star" size={12} color="#EAB308" style={styles.ratingIcon} />
            <Text style={styles.athleteMetaText}>
              {athlete.averageRating != null ? athlete.averageRating.toFixed(1) : '—'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.coverContainer}>
        {athlete.profilePhoto ? (
          <Image source={{ uri: athlete.profilePhoto }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.coverImage} />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFillObject} />
        {athlete.topRated && (
          <View style={styles.topRatedBadge}>
            <Text style={styles.topRatedText}>TOP RATED</Text>
          </View>
        )}
      </View>
      <View style={styles.athleteActions}>
        <TouchableOpacity style={styles.viewProfileBtn} onPress={onViewProfile} activeOpacity={0.85}>
          <Text style={styles.viewProfileBtnText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendOfferBtn} onPress={onSendOffer} activeOpacity={0.85}>
          <Text style={styles.sendOfferBtnText}>Send Offer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.favoriteBtn, athlete.isFavorited && styles.favoriteBtnActive]}
          onPress={onFavorite}
          activeOpacity={0.85}
        >
          <Ionicons
            name={athlete.isFavorited ? 'star' : 'star-outline'}
            size={20}
            color={athlete.isFavorited ? '#ffffff' : '#06B6D4'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
export default function ScoutDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedSport, setSelectedSport] = useState('All Sports');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.get('/api/Scout/dashboard');
      setDashboardStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  }, []);
  const loadAthletes = useCallback(async () => {
    try {
      const params = {};
      if (selectedSport !== 'All Sports') params.sport = selectedSport;
      const res = await api.get('/api/Scout/discover', { params });
      setAthletes(res.data);
    } catch (err) {
      console.error('Failed to load athletes:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  useEffect(() => {
    loadAthletes();
  }, [loadAthletes]);
  const filteredAthletes = athletes.filter((athlete) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (athlete.name || '').toLowerCase().includes(q) ||
      (athlete.sport || '').toLowerCase().includes(q) ||
      (athlete.position || '').toLowerCase().includes(q) ||
      (athlete.region || '').toLowerCase().includes(q)
    );
  });
  const handleFavorite = async (athlete) => {
    const wasFavorited = athlete.isFavorited;
    setAthletes((prev) =>
      prev.map((a) => (a.athleteId === athlete.athleteId ? { ...a, isFavorited: !wasFavorited } : a))
    );
    try {
      if (wasFavorited) {
        await api.delete(`/api/Scout/favorites/${athlete.athleteId}`);
      } else {
        await api.post(`/api/Scout/favorites/${athlete.athleteId}`);
      }
      loadDashboard(); // refresh the "Favorites" count
    } catch (err) {
      setAthletes((prev) =>
        prev.map((a) => (a.athleteId === athlete.athleteId ? { ...a, isFavorited: wasFavorited } : a))
      );
      Alert.alert('Error', 'Could not update favorites. Please try again.');
    }
  };
  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (tab === 'discover') navigation.navigate('Search');
    if (tab === 'messages') navigation.navigate('Messages');
    if (tab === 'profile') navigation.navigate('Profile');
  };
  const handleViewProfile = async (athlete) => {
    try {
      await api.post(`/api/Scout/view/${athlete.athleteId}`);
      loadDashboard(); // refresh the "Scouted" count
    } catch (err) {
      console.error('Failed to record profile view:', err);
    }
    navigation.navigate('PublicProfile', { type: 'Athlete', id: athlete.athleteId });
  };
  const handleSendOffer = (athlete) => {
    Alert.alert(
      'Send Recruitment Offer',
      `Send a recruitment offer to ${athlete.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Offer',
          onPress: async () => {
            try {
              await api.post(`/api/Scout/offers/${athlete.athleteId}`, {
                offerMessage: `Interested in recruiting ${athlete.name}.`,
              });
              Alert.alert('Offer Sent', `Recruitment offer sent to ${athlete.name}!`);
              loadDashboard(); // refresh the "Recruited" count context
            } catch (err) {
              Alert.alert('Error', err?.response?.data ?? 'Could not send the offer.');
            }
          },
        },
      ]
    );
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PRIME SCOUT</Text>
          <Text style={styles.headerSubtitle}>Scout Dashboard</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => searchInputRef.current?.focus()}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleTabPress('messages')}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSection}>
          <LinearGradient colors={['#06B6D4', '#2563EB']} style={styles.heroCard}>
            <View style={styles.heroTextWrapper}>
              <Text style={styles.heroTitle}>Find Future Stars</Text>
              <Text style={styles.heroSubtitle}>
                Discover verified athletes, review their stats, and start recruitment conversations.
              </Text>
            </View>
            <View style={styles.heroIconCircle}>
              <Ionicons name="trophy-outline" size={32} color="#ffffff" />
            </View>
          </LinearGradient>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Scout Dashboard</Text>
          {dashboardStats ? (
            <View style={styles.statsRow}>
              <DashboardStatCard
                icon="people-outline"
                label="Scouted"
                value={String(dashboardStats.scoutedCount)}
                gradientStart="#ECFEFF"
                gradientEnd="#CFFAFE"
                iconColor="#0891B2"
              />
              <DashboardStatCard
                icon="star-outline"
                label="Favorites"
                value={String(dashboardStats.favoritesCount)}
                gradientStart="#FAF5FF"
                gradientEnd="#EDE9FE"
                iconColor="#7C3AED"
              />
              <DashboardStatCard
                icon="trophy-outline"
                label="Recruited"
                value={String(dashboardStats.recruitedCount)}
                gradientStart="#F0FDF4"
                gradientEnd="#DCFCE7"
                iconColor="#16A34A"
              />
            </View>
          ) : (
            <ActivityIndicator color="#06B6D4" />
          )}
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Find Top Talent</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search by sport, location, or name..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {SPORTS.map((sport) => (
              <SportChip
                key={sport}
                label={sport}
                active={selectedSport === sport}
                onPress={() => setSelectedSport(sport)}
              />
            ))}
          </ScrollView>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Athletes</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#06B6D4" style={{ marginVertical: 24 }} />
          ) : filteredAthletes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No athletes found</Text>
              <Text style={styles.emptyStateSub}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filteredAthletes.map((athlete) => (
              <AthleteCard
                key={athlete.athleteId}
                athlete={athlete}
                onFavorite={() => handleFavorite(athlete)}
                onViewProfile={() => handleViewProfile(athlete)}
                onSendOffer={() => handleSendOffer(athlete)}
              />
            ))
          )}
        </View>
      </ScrollView>
      <View style={styles.bottomNav}>
        {[
          { tab: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
          { tab: 'discover', icon: 'search-outline', activeIcon: 'search', label: 'Discover' },
          { tab: 'messages', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses', label: 'Messages' },
          { tab: 'profile', icon: 'person-outline', activeIcon: 'person', label: 'Me' },
        ].map((item) => (
          <TouchableOpacity
            key={item.tab}
            style={styles.navTab}
            onPress={() => handleTabPress(item.tab)}
            activeOpacity={0.7}
          >
            <View>
              <Ionicons
                name={activeTab === item.tab ? item.activeIcon : item.icon}
                size={24}
                color={activeTab === item.tab ? '#06B6D4' : '#6B7280'}
              />
            </View>
            <Text style={[styles.navLabel, activeTab === item.tab && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
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
  headerTitle: { fontSize: responsive(20), fontWeight: '800', color: '#000000', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: responsive(12), color: '#6B7280', marginTop: 2 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: responsive(8), borderRadius: 10, position: 'relative' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: responsive(24) },
  heroSection: { paddingHorizontal: responsive(16), paddingTop: responsive(16), paddingBottom: responsive(8) },
  heroCard: {
    borderRadius: responsive(20),
    padding: responsive(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextWrapper: { flex: 1, paddingRight: responsive(12) },
  heroTitle: { fontSize: responsive(22), fontWeight: '800', color: '#ffffff', marginBottom: responsive(6) },
  heroSubtitle: { fontSize: responsive(13), lineHeight: responsive(19), color: '#E0F2FE' },
  heroIconCircle: {
    width: responsive(58),
    height: responsive(58),
    borderRadius: responsive(29),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    marginBottom: responsive(8),
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: { fontSize: responsive(16), fontWeight: '700', color: '#000000', marginBottom: responsive(12) },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsive(12),
  },
  viewAllText: { fontSize: responsive(14), fontWeight: '600', color: '#06B6D4' },
  statsRow: { flexDirection: 'row', gap: responsive(10) },
  statCard: {
    flex: 1,
    minHeight: responsive(104),
    borderRadius: responsive(14),
    paddingVertical: responsive(14),
    paddingHorizontal: responsive(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: responsive(24), fontWeight: '800', color: '#000000', marginTop: responsive(4) },
  statLabel: { fontSize: responsive(11), color: '#6B7280', marginTop: responsive(2) },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: responsive(24),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: responsive(14),
    paddingVertical: Platform.OS === 'ios' ? responsive(12) : responsive(8),
    marginBottom: responsive(12),
  },
  searchIcon: { marginRight: responsive(8) },
  searchInput: { flex: 1, fontSize: responsive(14), color: '#000000', paddingVertical: 0 },
  chipsRow: { paddingBottom: responsive(4), gap: responsive(8) },
  chip: {
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(8),
    borderRadius: responsive(20),
    backgroundColor: '#F3F4F6',
  },
  chipActive: { backgroundColor: '#06B6D4' },
  chipText: { fontSize: responsive(13), fontWeight: '500', color: '#374151' },
  chipTextActive: { color: '#ffffff' },
  athleteCard: {
    backgroundColor: '#ffffff',
    borderRadius: responsive(16),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: responsive(16),
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  athleteHeader: { flexDirection: 'row', alignItems: 'center', padding: responsive(14), gap: responsive(12) },
  athleteAvatar: {
    width: responsive(56),
    height: responsive(56),
    borderRadius: responsive(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  athleteAvatarImage: {
    width: responsive(56),
    height: responsive(56),
    borderRadius: responsive(28),
  },
  avatarText: { fontSize: responsive(22), fontWeight: '800', color: '#ffffff' },
  athleteInfo: { flex: 1 },
  athleteNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: responsive(2) },
  athleteName: { flexShrink: 1, fontSize: responsive(16), fontWeight: '700', color: '#000000' },
  verifiedIcon: { marginLeft: responsive(4) },
  athleteSport: { fontSize: responsive(13), color: '#374151', marginBottom: responsive(4) },
  athleteMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 2 },
  athleteMetaText: { fontSize: responsive(12), color: '#6B7280', marginLeft: 2 },
  ratingIcon: { marginLeft: responsive(8) },
  coverContainer: { height: responsive(180), position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  topRatedBadge: {
    position: 'absolute',
    top: responsive(10),
    right: responsive(10),
    backgroundColor: '#06B6D4',
    paddingHorizontal: responsive(10),
    paddingVertical: responsive(4),
    borderRadius: responsive(12),
  },
  topRatedText: { fontSize: responsive(11), fontWeight: '700', color: '#ffffff' },
  athleteActions: { flexDirection: 'row', alignItems: 'center', padding: responsive(14), gap: responsive(8) },
  viewProfileBtn: {
    flex: 1,
    backgroundColor: '#06B6D4',
    borderRadius: responsive(24),
    paddingVertical: responsive(12),
    alignItems: 'center',
  },
  viewProfileBtnText: { fontSize: responsive(14), fontWeight: '600', color: '#ffffff' },
  sendOfferBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#06B6D4',
    borderRadius: responsive(24),
    paddingVertical: responsive(10),
    alignItems: 'center',
  },
  sendOfferBtnText: { fontSize: responsive(14), fontWeight: '600', color: '#06B6D4' },
  favoriteBtn: {
    width: responsive(46),
    height: responsive(46),
    borderRadius: responsive(23),
    borderWidth: 2,
    borderColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBtnActive: { backgroundColor: '#06B6D4', borderColor: '#06B6D4' },
  emptyState: { alignItems: 'center', paddingVertical: responsive(40) },
  emptyStateText: { fontSize: responsive(16), fontWeight: '600', color: '#6B7280', marginTop: responsive(12) },
  emptyStateSub: { fontSize: responsive(13), color: '#9CA3AF', marginTop: responsive(4) },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: responsive(8),
    paddingBottom: Platform.OS === 'ios' ? responsive(20) : responsive(8),
    paddingHorizontal: responsive(8),
    ...Platform.select({
      ios: { shadowColor: '#000000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 8 },
    }),
  },
  navTab: { flex: 1, alignItems: 'center', gap: responsive(4), paddingVertical: responsive(4), position: 'relative' },
  navLabel: { fontSize: responsive(11), fontWeight: '500', color: '#6B7280' },
  navLabelActive: { color: '#06B6D4' },
});