import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

const COLORS = {
  cyan: '#06B6D4',
  black: '#000000',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 390;
const responsive = (size) => Math.round(size * Math.min(Math.max(scale, 0.85), 1.18));

const TYPE_TABS = ['All', 'Athletes', 'Coaches', 'Scouts'];
const SPORTS = ['Soccer'];

export default function SearchScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [myUserId, setMyUserId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [selectedSport, setSelectedSport] = useState('Soccer');

  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());

  // Cache the raw lists once fetched, so re-typing doesn't re-hit the API every keystroke.
  const dataCache = useRef(null);

  useEffect(() => {
    (async () => {
      const idStr = await AsyncStorage.getItem('userId');
      setMyUserId(idStr ? parseInt(idStr, 10) : null);
    })();
  }, []);

  // Debounced search — only fetches/shows anything once the user actually types.
  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timeout = setTimeout(() => {
      runSearch(query);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeType, selectedSport]);

  const runSearch = async (query) => {
    setLoading(true);
    setHasSearched(true);

    try {
      if (!dataCache.current) {
        const [athletesRes, coachesRes, scoutsRes, followingRes] = await Promise.all([
          api.get('/api/Athlete/GetAllAthletes'),
          api.get('/api/Coach/GetAllCoach'),
          api.get('/api/Scout'),
          api.get('/api/User/Getfollowing'),
        ]);

        dataCache.current = {
          athletes: athletesRes.data.map((a) => ({ ...a, _type: 'Athlete' })),
          coaches: coachesRes.data.map((c) => ({ ...c, _type: 'Coach' })),
          scouts: scoutsRes.data.map((s) => ({ ...s, _type: 'Scout' })),
        };

        setFollowingIds(new Set(followingRes.data));
      }

      const { athletes, coaches, scouts } = dataCache.current;

      let list = [];
      if (activeType === 'All' || activeType === 'Athletes') list = list.concat(athletes);
      if (activeType === 'All' || activeType === 'Coaches') list = list.concat(coaches);
      if (activeType === 'All' || activeType === 'Scouts') list = list.concat(scouts);

      const q = query.toLowerCase();

      const filtered = list
        .filter((item) => item.userId !== myUserId)
        .filter((item) => {
          if (item._type === 'Athlete' && item.sport && selectedSport) {
            if (item.sport.toLowerCase() !== selectedSport.toLowerCase()) return false;
          }
          if (item._type === 'Scout' && item.sportFocus && selectedSport) {
            if (item.sportFocus.toLowerCase() !== selectedSport.toLowerCase()) return false;
          }
          return (item.name || '').toLowerCase().includes(q);
        });

      setResults(filtered);
    } catch (err) {
      console.error('Search error:', err);
      Alert.alert('Error', 'Could not search right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (item) => {
    if (!item.userId) {
      Alert.alert('Unavailable', 'This account cannot be followed right now.');
      return;
    }

    const isFollowing = followingIds.has(item.userId);

    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(item.userId);
      else next.add(item.userId);
      return next;
    });

    try {
      if (isFollowing) {
        await api.delete(`/api/User/Unfollow/${item.userId}`);
      } else {
        await api.post(`/api/User/follow/${item.userId}`);
      }
    } catch (err) {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.add(item.userId);
        else next.delete(item.userId);
        return next;
      });
      Alert.alert('Error', 'Could not update follow status. Please try again.');
    }
  };

  const handleMessage = (item) => {
    if (!item.userId) {
      Alert.alert('Unavailable', 'This account cannot be messaged right now.');
      return;
    }

    navigation.navigate('Messages', {
      recipientId: item.userId,
      recipientName: item.name,
    });
  };

  const handleViewProfile = (item) => {
    const idByType = {
      Athlete: item.athleteId,
      Coach: item.coachId,
      Scout: item.scoutId,
    };

    navigation.navigate('PublicProfile', {
      type: item._type,
      id: idByType[item._type],
      isFollowing: item.userId ? followingIds.has(item.userId) : false,
    });
  };

  const subtitleFor = (item) => {
    if (item._type === 'Athlete') {
      return `${item.sport ?? '—'}${item.position ? ' • ' + item.position : ''}${item.region ? ' • ' + item.region : ''}`;
    }
    if (item._type === 'Coach') {
      return item.affiliation || 'Coach';
    }
    if (item._type === 'Scout') {
      return `${item.organization ?? 'Scout'}${item.sportFocus ? ' • ' + item.sportFocus : ''}`;
    }
    return '';
  };

  const badgeFor = (item) => {
    if (item._type === 'Athlete' && item.verified) {
      return (
        <View style={styles.verifiedBadge}>
          <Feather name="check" size={11} color={COLORS.white} />
          <Text style={styles.verifiedBadgeText}>Verified</Text>
        </View>
      );
    }
    return null;
  };

  const renderItem = ({ item }) => {
    const initial = (item.name || '?').charAt(0).toUpperCase();
    const isFollowing = item.userId ? followingIds.has(item.userId) : false;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {item.profilePhoto ? (
            <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
          )}

          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <View style={styles.typeTag}>
                <Text style={styles.typeTagText}>{item._type}</Text>
              </View>
            </View>

            <Text style={styles.subtitle} numberOfLines={1}>{subtitleFor(item)}</Text>

            {badgeFor(item)}
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.viewButton}
            onPress={() => handleViewProfile(item)}
          >
            <Text style={styles.viewButtonText}>View Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.followButton, isFollowing && styles.followButtonActive]}
            onPress={() => handleToggleFollow(item)}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.circleButton}
            onPress={() => handleMessage(item)}
          >
            <Feather name="mail" size={18} color={COLORS.gray700} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={22} color={COLORS.gray700} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Search</Text>
        </View>

        <View style={styles.searchWrapper}>
          <Feather name="search" size={18} color={COLORS.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Feather name="x-circle" size={18} color={COLORS.gray400} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {TYPE_TABS.map((tab) => {
            const active = tab === activeType;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.75}
                style={[styles.tabChip, active && styles.tabChipActive]}
                onPress={() => setActiveType(tab)}
              >
                <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sportsRow}
        >
          {SPORTS.map((sport) => {
            const active = sport === selectedSport;
            return (
              <TouchableOpacity
                key={sport}
                activeOpacity={0.75}
                style={[styles.sportChip, active && styles.sportChipActive]}
                onPress={() => setSelectedSport(sport)}
              >
                <Text style={[styles.sportChipText, active && styles.sportChipTextActive]}>{sport}</Text>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.moreSportsNote}>More sports coming soon</Text>
        </ScrollView>
      </View>

      {!hasSearched ? (
        <View style={styles.center}>
          <Feather name="search" size={48} color={COLORS.gray300} />
          <Text style={styles.promptTitle}>Search for people</Text>
          <Text style={styles.promptText}>
            Type a name above to find Athletes, Coaches, or Scouts.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item._type}-${item.athleteId ?? item.coachId ?? item.scoutId ?? index}`}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: 24 + insets.bottom }]}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="frown" size={48} color={COLORS.gray300} />
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.gray50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: responsive(60), paddingHorizontal: responsive(32) },

  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingHorizontal: responsive(16),
    paddingTop: responsive(12),
    paddingBottom: responsive(8),
  },

  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: responsive(10), marginBottom: responsive(12) },
  backButton: { width: responsive(36), height: responsive(36), alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: responsive(22), fontWeight: '700', color: COLORS.black },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: responsive(24),
    paddingHorizontal: responsive(14),
    height: responsive(44),
    marginBottom: responsive(10),
    gap: responsive(8),
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: responsive(15), color: COLORS.black },

  tabsRow: { paddingBottom: responsive(8), gap: responsive(8) },
  tabChip: { paddingHorizontal: responsive(14), paddingVertical: responsive(7), borderRadius: responsive(18), backgroundColor: COLORS.gray100 },
  tabChipActive: { backgroundColor: COLORS.cyan },
  tabChipText: { fontSize: responsive(13), fontWeight: '600', color: COLORS.gray700 },
  tabChipTextActive: { color: COLORS.white },

  sportsRow: { alignItems: 'center', gap: responsive(8) },
  sportChip: { paddingHorizontal: responsive(14), paddingVertical: responsive(6), borderRadius: responsive(16), borderWidth: 1, borderColor: COLORS.cyan },
  sportChipActive: { backgroundColor: COLORS.cyan },
  sportChipText: { fontSize: responsive(12), fontWeight: '600', color: COLORS.cyan },
  sportChipTextActive: { color: COLORS.white },
  moreSportsNote: { fontSize: responsive(11), color: COLORS.gray400, marginLeft: responsive(6) },

  promptTitle: { fontSize: responsive(16), fontWeight: '700', color: COLORS.gray500, marginTop: responsive(14) },
  promptText: { fontSize: responsive(13), color: COLORS.gray400, marginTop: responsive(4), textAlign: 'center' },

  listContent: { padding: responsive(16), flexGrow: 1 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: responsive(14),
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: responsive(14),
    marginBottom: responsive(12),
  },

  cardRow: { flexDirection: 'row', alignItems: 'center', gap: responsive(12), marginBottom: responsive(12) },

  avatar: {
    width: responsive(52),
    height: responsive(52),
    borderRadius: responsive(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: responsive(19) },

  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: responsive(8) },
  name: { flex: 1, fontSize: responsive(15), fontWeight: '700', color: COLORS.black },

  typeTag: { paddingHorizontal: responsive(8), paddingVertical: responsive(2), borderRadius: responsive(10), backgroundColor: COLORS.gray100 },
  typeTagText: { fontSize: responsive(10), fontWeight: '600', color: COLORS.gray500 },

  subtitle: { fontSize: responsive(13), color: COLORS.gray500, marginTop: responsive(2) },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.cyan,
    alignSelf: 'flex-start',
    borderRadius: responsive(8),
    paddingHorizontal: responsive(6),
    paddingVertical: responsive(2),
    marginTop: responsive(4),
  },
  verifiedBadgeText: { color: COLORS.white, fontSize: responsive(10), fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: responsive(8) },

  viewButton: {
    flex: 1,
    height: responsive(40),
    backgroundColor: COLORS.cyan,
    borderRadius: responsive(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: { color: COLORS.white, fontSize: responsive(13), fontWeight: '600' },

  followButton: {
    paddingHorizontal: responsive(14),
    height: responsive(40),
    borderRadius: responsive(20),
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonActive: { backgroundColor: COLORS.cyan },
  followButtonText: { fontSize: responsive(13), fontWeight: '600', color: COLORS.cyan },
  followButtonTextActive: { color: COLORS.white },

  circleButton: {
    width: responsive(40),
    height: responsive(40),
    borderRadius: responsive(20),
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: { fontSize: responsive(14), color: COLORS.gray400, marginTop: responsive(12) },
});