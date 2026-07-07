import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const scale = SCREEN_WIDTH / 390;
const responsive = size => Math.round(size * Math.min(scale, 1.2));

const DASHBOARD_STATS = [
  {
    id: 's1',
    label: 'Scouted',
    value: '24',
    icon: 'people-outline',
    gradientStart: '#ECFEFF',
    gradientEnd: '#CFFAFE',
    iconColor: '#0891B2',
  },
  {
    id: 's2',
    label: 'Favorites',
    value: '12',
    icon: 'star-outline',
    gradientStart: '#FAF5FF',
    gradientEnd: '#EDE9FE',
    iconColor: '#7C3AED',
  },
  {
    id: 's3',
    label: 'Recruited',
    value: '8',
    icon: 'trophy-outline',
    gradientStart: '#F0FDF4',
    gradientEnd: '#DCFCE7',
    iconColor: '#16A34A',
  },
];

const SPORTS = ['All Sports', 'Football', 'Basketball', 'Rugby', 'Track & Field'];

const ATHLETES = [
  {
    id: 'a1',
    name: 'Jordan Martinez',
    sport: 'Basketball',
    position: 'Point Guard',
    location: 'Johannesburg, SA',
    rating: 8.7,
    stats: '28 PPG • 12 RPG',
    goals: 34,
    assists: 18,
    matches: 52,
    coverImage:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
    verified: true,
    age: 19,
  },
  {
    id: 'a2',
    name: 'Thabo Mkhize',
    sport: 'Football',
    position: 'Striker',
    location: 'Cape Town, SA',
    rating: 9.2,
    stats: '15 Goals • 8 Assists',
    goals: 42,
    assists: 15,
    matches: 38,
    coverImage:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    verified: true,
    age: 17,
  },
  {
    id: 'a3',
    name: 'Alex Chen',
    sport: 'Track & Field',
    position: 'Sprinter',
    location: 'Durban, SA',
    rating: 8.9,
    stats: 'Personal Best: 48.2s',
    goals: 28,
    assists: 12,
    matches: 45,
    coverImage:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
    verified: true,
    age: 16,
  },
];

function DashboardStatCard({ stat }) {
  return (
    <LinearGradient
      colors={[stat.gradientStart, stat.gradientEnd]}
      style={styles.statCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Ionicons name={stat.icon} size={24} color={stat.iconColor} />
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
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
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AthleteCard({
  athlete,
  isFavorite,
  onFavorite,
  onViewProfile,
  onSendOffer,
}) {
  return (
    <View style={styles.athleteCard}>
      <View style={styles.athleteHeader}>
        <LinearGradient
          colors={['#06B6D4', '#3B82F6']}
          style={styles.athleteAvatar}
        >
          <Text style={styles.avatarText}>{athlete.name.charAt(0)}</Text>
        </LinearGradient>

        <View style={styles.athleteInfo}>
          <View style={styles.athleteNameRow}>
            <Text style={styles.athleteName} numberOfLines={1}>
              {athlete.name}
            </Text>

            {athlete.verified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#06B6D4"
                style={styles.verifiedIcon}
              />
            )}
          </View>

          <Text style={styles.athleteSport}>
            {athlete.sport} • {athlete.position}
          </Text>

          <View style={styles.athleteMeta}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.athleteMetaText}>{athlete.location}</Text>

            <Ionicons
              name="star"
              size={12}
              color="#EAB308"
              style={styles.ratingIcon}
            />
            <Text style={styles.athleteMetaText}>{athlete.rating}</Text>
          </View>
        </View>
      </View>

      <View style={styles.coverContainer}>
        <Image
          source={{ uri: athlete.coverImage }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.coverOverlay}>
          <View style={styles.coverOverlayRow}>
            <Ionicons name="trending-up" size={14} color="#4ADE80" />
            <Text style={styles.coverOverlayLabel}>
              Performance Highlights
            </Text>
          </View>
          <Text style={styles.coverOverlayStats}>{athlete.stats}</Text>
        </View>

        <View style={styles.topRatedBadge}>
          <Text style={styles.topRatedText}>TOP RATED</Text>
        </View>
      </View>

      <View style={styles.playerStatsRow}>
        <View style={styles.playerStatBox}>
          <Text style={styles.playerStatValue}>{athlete.goals}</Text>
          <Text style={styles.playerStatLabel}>Goals</Text>
        </View>

        <View style={styles.playerStatBox}>
          <Text style={styles.playerStatValue}>{athlete.assists}</Text>
          <Text style={styles.playerStatLabel}>Assists</Text>
        </View>

        <View style={styles.playerStatBox}>
          <Text style={styles.playerStatValue}>{athlete.matches}</Text>
          <Text style={styles.playerStatLabel}>Matches</Text>
        </View>

        <View style={styles.playerStatBox}>
          <Text style={styles.playerStatValue}>{athlete.age}</Text>
          <Text style={styles.playerStatLabel}>Age</Text>
        </View>
      </View>

      <View style={styles.athleteActions}>
        <TouchableOpacity
          style={styles.viewProfileBtn}
          onPress={onViewProfile}
          activeOpacity={0.85}
        >
          <Text style={styles.viewProfileBtnText}>View Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sendOfferBtn}
          onPress={onSendOffer}
          activeOpacity={0.85}
        >
          <Text style={styles.sendOfferBtnText}>Send Offer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.favoriteBtn, isFavorite && styles.favoriteBtnActive]}
          onPress={onFavorite}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isFavorite ? 'star' : 'star-outline'}
            size={20}
            color={isFavorite ? '#ffffff' : '#06B6D4'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ScoutDashboardScreen({ onNavigate, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedSport, setSelectedSport] = useState('All Sports');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteAthletes, setFavoriteAthletes] = useState(new Set());
  const searchInputRef = useRef(null);

  const filteredAthletes = ATHLETES.filter(athlete => {
    const matchesSport =
      selectedSport === 'All Sports' || athlete.sport === selectedSport;

    const searchText = searchQuery.toLowerCase().trim();

    const matchesSearch =
      searchText === '' ||
      athlete.name.toLowerCase().includes(searchText) ||
      athlete.sport.toLowerCase().includes(searchText) ||
      athlete.position.toLowerCase().includes(searchText) ||
      athlete.location.toLowerCase().includes(searchText);

    return matchesSport && matchesSearch;
  });

  const handleFavorite = athleteId => {
    setFavoriteAthletes(prev => {
      const next = new Set(prev);

      if (next.has(athleteId)) {
        next.delete(athleteId);
      } else {
        next.add(athleteId);
      }

      return next;
    });
  };

  const handleTabPress = tab => {
    setActiveTab(tab);

    if (tab === 'discover') {
      onNavigate?.('Search');
    }

    if (tab === 'messages') {
      onNavigate?.('Messages');
    }

    if (tab === 'profile') {
      onNavigate?.('ScoutProfile');
    }
  };

  const handleViewProfile = athlete => {
    onNavigate?.('AthletePublicProfile', { athlete });
  };

  const handleSendOffer = athlete => {
    Alert.alert(
      'Send Recruitment Offer',
      `Send a recruitment offer to ${athlete.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send Offer',
          onPress: () =>
            Alert.alert(
              'Offer Sent',
              `Recruitment offer sent to ${athlete.name}!`
            ),
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
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color="#374151"
            />
            <View style={styles.badgeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onNavigate?.('Settings')}
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
          <LinearGradient
            colors={['#06B6D4', '#2563EB']}
            style={styles.heroCard}
          >
            <View style={styles.heroTextWrapper}>
              <Text style={styles.heroTitle}>Find Future Stars</Text>
              <Text style={styles.heroSubtitle}>
                Discover verified athletes, review their stats, and start
                recruitment conversations.
              </Text>
            </View>

            <View style={styles.heroIconCircle}>
              <Ionicons name="trophy-outline" size={32} color="#ffffff" />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Scout Dashboard</Text>

          <View style={styles.statsRow}>
            {DASHBOARD_STATS.map(stat => (
              <DashboardStatCard key={stat.id} stat={stat} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Find Top Talent</Text>

            <TouchableOpacity onPress={() => onNavigate?.('Search')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#9CA3AF"
              style={styles.searchIcon}
            />

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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {SPORTS.map(sport => (
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

          {filteredAthletes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No athletes found</Text>
              <Text style={styles.emptyStateSub}>
                Try adjusting your search or filters
              </Text>
            </View>
          ) : (
            filteredAthletes.map(athlete => (
              <AthleteCard
                key={athlete.id}
                athlete={athlete}
                isFavorite={favoriteAthletes.has(athlete.id)}
                onFavorite={() => handleFavorite(athlete.id)}
                onViewProfile={() => handleViewProfile(athlete)}
                onSendOffer={() => handleSendOffer(athlete)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        {[
          {
            tab: 'home',
            icon: 'home-outline',
            activeIcon: 'home',
            label: 'Home',
          },
          {
            tab: 'discover',
            icon: 'search-outline',
            activeIcon: 'search',
            label: 'Discover',
          },
          {
            tab: 'messages',
            icon: 'chatbubble-ellipses-outline',
            activeIcon: 'chatbubble-ellipses',
            label: 'Messages',
            badge: true,
          },
          {
            tab: 'profile',
            icon: 'person-outline',
            activeIcon: 'person',
            label: 'Me',
          },
        ].map(item => (
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
    letterSpacing: 0.5,
  },

  headerSubtitle: {
    fontSize: responsive(12),
    color: '#6B7280',
    marginTop: 2,
  },

  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBtn: {
    padding: responsive(8),
    borderRadius: 10,
    position: 'relative',
  },

  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: responsive(24),
  },

  heroSection: {
    paddingHorizontal: responsive(16),
    paddingTop: responsive(16),
    paddingBottom: responsive(8),
  },

  heroCard: {
    borderRadius: responsive(20),
    padding: responsive(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroTextWrapper: {
    flex: 1,
    paddingRight: responsive(12),
  },

  heroTitle: {
    fontSize: responsive(22),
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: responsive(6),
  },

  heroSubtitle: {
    fontSize: responsive(13),
    lineHeight: responsive(19),
    color: '#E0F2FE',
  },

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

  sectionTitle: {
    fontSize: responsive(16),
    fontWeight: '700',
    color: '#000000',
    marginBottom: responsive(12),
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsive(12),
  },

  viewAllText: {
    fontSize: responsive(14),
    fontWeight: '600',
    color: '#06B6D4',
  },

  statsRow: {
    flexDirection: 'row',
    gap: responsive(10),
  },

  statCard: {
    flex: 1,
    minHeight: responsive(104),
    borderRadius: responsive(14),
    paddingVertical: responsive(14),
    paddingHorizontal: responsive(8),
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    fontSize: responsive(24),
    fontWeight: '800',
    color: '#000000',
    marginTop: responsive(4),
  },

  statLabel: {
    fontSize: responsive(11),
    color: '#6B7280',
    marginTop: responsive(2),
  },

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

  searchIcon: {
    marginRight: responsive(8),
  },

  searchInput: {
    flex: 1,
    fontSize: responsive(14),
    color: '#000000',
    paddingVertical: 0,
  },

  chipsRow: {
    paddingBottom: responsive(4),
    gap: responsive(8),
  },

  chip: {
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(8),
    borderRadius: responsive(20),
    backgroundColor: '#F3F4F6',
  },

  chipActive: {
    backgroundColor: '#06B6D4',
  },

  chipText: {
    fontSize: responsive(13),
    fontWeight: '500',
    color: '#374151',
  },

  chipTextActive: {
    color: '#ffffff',
  },

  athleteCard: {
    backgroundColor: '#ffffff',
    borderRadius: responsive(16),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: responsive(16),
    overflow: 'hidden',
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

  athleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsive(14),
    gap: responsive(12),
  },

  athleteAvatar: {
    width: responsive(56),
    height: responsive(56),
    borderRadius: responsive(28),
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: responsive(22),
    fontWeight: '800',
    color: '#ffffff',
  },

  athleteInfo: {
    flex: 1,
  },

  athleteNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsive(2),
  },

  athleteName: {
    flexShrink: 1,
    fontSize: responsive(16),
    fontWeight: '700',
    color: '#000000',
  },

  verifiedIcon: {
    marginLeft: responsive(4),
  },

  athleteSport: {
    fontSize: responsive(13),
    color: '#374151',
    marginBottom: responsive(4),
  },

  athleteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },

  athleteMetaText: {
    fontSize: responsive(12),
    color: '#6B7280',
    marginLeft: 2,
  },

  ratingIcon: {
    marginLeft: responsive(8),
  },

  coverContainer: {
    height: responsive(180),
    position: 'relative',
  },

  coverImage: {
    width: '100%',
    height: '100%',
  },

  coverOverlay: {
    position: 'absolute',
    bottom: responsive(12),
    left: responsive(14),
    right: responsive(14),
  },

  coverOverlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsive(4),
    gap: 4,
  },

  coverOverlayLabel: {
    fontSize: responsive(13),
    fontWeight: '600',
    color: '#ffffff',
  },

  coverOverlayStats: {
    fontSize: responsive(14),
    fontWeight: '500',
    color: '#ffffff',
  },

  topRatedBadge: {
    position: 'absolute',
    top: responsive(10),
    right: responsive(10),
    backgroundColor: '#06B6D4',
    paddingHorizontal: responsive(10),
    paddingVertical: responsive(4),
    borderRadius: responsive(12),
  },

  topRatedText: {
    fontSize: responsive(11),
    fontWeight: '700',
    color: '#ffffff',
  },

  playerStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: responsive(14),
    paddingTop: responsive(14),
    gap: responsive(8),
  },

  playerStatBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: responsive(12),
    paddingVertical: responsive(10),
    alignItems: 'center',
  },

  playerStatValue: {
    fontSize: responsive(16),
    fontWeight: '800',
    color: '#111827',
  },

  playerStatLabel: {
    fontSize: responsive(11),
    color: '#6B7280',
    marginTop: 2,
  },

  athleteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsive(14),
    gap: responsive(8),
  },

  viewProfileBtn: {
    flex: 1,
    backgroundColor: '#06B6D4',
    borderRadius: responsive(24),
    paddingVertical: responsive(12),
    alignItems: 'center',
  },

  viewProfileBtnText: {
    fontSize: responsive(14),
    fontWeight: '600',
    color: '#ffffff',
  },

  sendOfferBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#06B6D4',
    borderRadius: responsive(24),
    paddingVertical: responsive(10),
    alignItems: 'center',
  },

  sendOfferBtnText: {
    fontSize: responsive(14),
    fontWeight: '600',
    color: '#06B6D4',
  },

  favoriteBtn: {
    width: responsive(46),
    height: responsive(46),
    borderRadius: responsive(23),
    borderWidth: 2,
    borderColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  favoriteBtnActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: responsive(40),
  },

  emptyStateText: {
    fontSize: responsive(16),
    fontWeight: '600',
    color: '#6B7280',
    marginTop: responsive(12),
  },

  emptyStateSub: {
    fontSize: responsive(13),
    color: '#9CA3AF',
    marginTop: responsive(4),
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
    position: 'relative',
  },

  navBadgeDot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
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