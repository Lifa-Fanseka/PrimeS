import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import api from '../api/client';
import VideoPlayer from '../components/VideoPlayer';

const { width: SCREEN_WIDTH, height: FALLBACK_HEIGHT } = Dimensions.get('window');

// Fisher-Yates shuffle — same unbiased pattern used for the Athlete
// feed. Applied once when the feed loads, not re-shuffled on every
// swipe, so the session stays consistent while you browse it.
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const TAG_OPTIONS = [
  { key: 'Urgent Review', label: 'Urgent Review', icon: 'flash-outline', color: '#EF4444' },
  { key: 'Physical Beast', label: 'Physical Beast', icon: 'barbell-outline', color: '#F59E0B' },
  { key: 'Backup Option', label: 'Backup Option', icon: 'bookmark-outline', color: '#6B7280' },
];

export default function ScoutFeedScreen({ navigation: navProp }) {
  const navHook = useNavigation();
  const navigation = navProp || navHook;

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openInfoMediaId, setOpenInfoMediaId] = useState(null);
  const [shortlistedIds, setShortlistedIds] = useState(new Set());
  const [tagMenuAthleteId, setTagMenuAthleteId] = useState(null);

  // Dimensions.get('window') is a static snapshot taken once, and on
  // some Android devices it doesn't actually match the height this
  // screen ends up rendering at (status bar / nav bar / safe-area
  // accounting differs by device). That mismatch is exactly what was
  // causing the drift — FlatList's paging math assumed one height,
  // the real content was a slightly different height, so pages
  // drifted out of sync and the next video peeked through underneath.
  // Measuring the container's own real rendered height with onLayout
  // sidesteps the whole issue — both the page size and the paging
  // math now always agree with whatever space is actually available.
  const [pageHeight, setPageHeight] = useState(FALLBACK_HEIGHT);

  const onContainerLayout = (event) => {
    const measuredHeight = event.nativeEvent.layout.height;
    if (measuredHeight > 0 && measuredHeight !== pageHeight) {
      setPageHeight(measuredHeight);
    }
  };

  const loadFeed = useCallback(async () => {
    try {
      const res = await api.get('/api/Media/ScoutFeed');
      setVideos(shuffleArray(res.data));
      setShortlistedIds(new Set(res.data.filter((v) => v.isShortlisted).map((v) => v.athleteId)));
    } catch (err) {
      console.error('Failed to load scout feed:', err);
      Alert.alert('Error', 'Could not load the video feed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Only the item that's almost fully in view counts as "active" — this
  // is what tells VideoPlayer which single instance should actually be
  // playing while every other mounted neighbor stays paused.
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 85 }).current;

  const toggleShortlist = async (athleteId) => {
    const wasShortlisted = shortlistedIds.has(athleteId);

    // Optimistic update + haptic, matching the original spec exactly —
    // the UI responds instantly, the network call happens after.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShortlistedIds((prev) => {
      const next = new Set(prev);
      if (wasShortlisted) next.delete(athleteId);
      else next.add(athleteId);
      return next;
    });

    try {
      if (wasShortlisted) {
        await api.delete(`/api/Scout/watchlist/${athleteId}`);
      } else {
        await api.post(`/api/Scout/watchlist/${athleteId}`);
      }
    } catch (err) {
      // revert on failure
      setShortlistedIds((prev) => {
        const next = new Set(prev);
        if (wasShortlisted) next.add(athleteId);
        else next.delete(athleteId);
        return next;
      });
      Alert.alert('Error', 'Could not update your shortlist. Please try again.');
    }
  };

  const openTagMenu = (athleteId) => {
    // A tag can only be assigned to an athlete already shortlisted —
    // long-pressing an un-shortlisted star shortlists them first, then
    // opens the menu, so the flow doesn't dead-end.
    if (!shortlistedIds.has(athleteId)) {
      toggleShortlist(athleteId);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTagMenuAthleteId(athleteId);
  };

  const assignTag = async (tagType) => {
    if (!tagMenuAthleteId) return;
    try {
      await api.put(`/api/Scout/watchlist/${tagMenuAthleteId}/tag`, { tag: tagType });
    } catch (err) {
      Alert.alert('Error', 'Could not save the tag.');
    } finally {
      setTagMenuAthleteId(null);
    }
  };

  const toggleInfo = (mediaId) => {
    setOpenInfoMediaId((prev) => (prev === mediaId ? null : mediaId));
  };

  const goToProfile = (athleteId) => {
    navigation.navigate('PublicProfile', { type: 'Athlete', id: athleteId });
  };

  const renderItem = ({ item, index }) => {
    const isShortlisted = shortlistedIds.has(item.athleteId);
    const infoOpen = openInfoMediaId === item.mediaId;
    const initial = (item.athleteName || '?').charAt(0).toUpperCase();

    const quickInfoParts = [
      item.position,
      item.birthYear ? String(item.birthYear) : null,
      item.region,
      item.dominantSide ? `${item.dominantSide}-footed` : null,
    ].filter(Boolean);

    return (
      <View style={[styles.page, { width: SCREEN_WIDTH, height: pageHeight }]}>
        <VideoPlayer
          uri={item.fileUrl}
          isActive={index === activeIndex}
          nativeControls={false}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.rightRail}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.8}
            onPress={() => goToProfile(item.athleteId)}
          >
            {item.athleteProfilePhoto ? (
              <ExpoImage
                source={{ uri: item.athleteProfilePhoto }}
                style={styles.avatarImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            {item.athleteVerified && (
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" size={9} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.railAction}
            activeOpacity={0.75}
            onPress={() => toggleShortlist(item.athleteId)}
            onLongPress={() => openTagMenu(item.athleteId)}
            delayLongPress={350}
          >
            <Ionicons
              name={isShortlisted ? 'star' : 'star-outline'}
              size={28}
              color={isShortlisted ? '#FACC15' : '#ffffff'}
            />
            <Text style={styles.railActionLabel}>shortlist</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.railAction}
            activeOpacity={0.75}
            onPress={() => toggleInfo(item.mediaId)}
          >
            <Ionicons
              name="information-circle-outline"
              size={28}
              color={infoOpen ? '#378ADD' : '#ffffff'}
            />
            <Text style={[styles.railActionLabel, infoOpen && { color: '#378ADD' }]}>info</Text>
          </TouchableOpacity>
        </View>

        {infoOpen && quickInfoParts.length > 0 && (
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>{quickInfoParts.join(' • ')}</Text>
          </View>
        )}

        <View style={styles.bottomOverlay}>
          <View style={styles.nameRow}>
            <Text style={styles.athleteName} numberOfLines={1}>{item.athleteName ?? 'Unknown Athlete'}</Text>
            {item.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedBadgeText}>recommended</Text>
              </View>
            )}
          </View>
          {item.caption ? (
            <Text style={styles.caption} numberOfLines={2}>"{item.caption}"</Text>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <FlatList
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.mediaId)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // Keeping a couple of neighboring items mounted (not actively
        // playing, just mounted) is what makes the swipe transition
        // feel instant — the next VideoPlayer instance and its
        // underlying player already exist the moment you reach it,
        // rather than being created fresh at that exact instant.
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        removeClippedSubviews={Platform.OS === 'android'}
        getItemLayout={(_, index) => ({
          length: pageHeight,
          offset: pageHeight * index,
          index,
        })}
        ListEmptyComponent={
          <View style={[styles.emptyState, { width: SCREEN_WIDTH, height: pageHeight }]}>
            <Ionicons name="videocam-off-outline" size={48} color="#4B5563" />
            <Text style={styles.emptyStateText}>No highlight videos yet.</Text>
          </View>
        }
      />

      <SafeAreaView style={styles.closeButtonSafeArea} edges={['top']}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
      </SafeAreaView>

      <Modal
        visible={!!tagMenuAthleteId}
        animationType="slide"
        transparent
        onRequestClose={() => setTagMenuAthleteId(null)}
      >
        <TouchableOpacity
          style={styles.tagSheetBackdrop}
          activeOpacity={1}
          onPress={() => setTagMenuAthleteId(null)}
        >
          <View style={styles.tagSheet}>
            <View style={styles.tagSheetHandle} />
            <Text style={styles.tagSheetTitle}>Tag this player</Text>
            {TAG_OPTIONS.map((tag) => (
              <TouchableOpacity
                key={tag.key}
                style={styles.tagOption}
                activeOpacity={0.75}
                onPress={() => assignTag(tag.key)}
              >
                <View style={[styles.tagIconCircle, { backgroundColor: tag.color + '22' }]}>
                  <Ionicons name={tag.icon} size={18} color={tag.color} />
                </View>
                <Text style={styles.tagOptionText}>{tag.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingScreen: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  page: {
    backgroundColor: '#000000',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyStateText: { color: '#9CA3AF', fontSize: 14 },

  rightRail: {
    position: 'absolute',
    right: 14,
    bottom: 130,
    alignItems: 'center',
    gap: 22,
  },
  avatarWrapper: { alignItems: 'center' },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarInitial: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  railAction: { alignItems: 'center', gap: 4 },
  railActionLabel: { fontSize: 10, color: '#ffffff', fontWeight: '500' },

  infoChip: {
    position: 'absolute',
    right: 66,
    bottom: 168,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: SCREEN_WIDTH * 0.55,
  },
  infoChipText: { color: '#ffffff', fontSize: 12, lineHeight: 17 },

  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 80,
    bottom: 40,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  athleteName: { color: '#ffffff', fontSize: 15, fontWeight: '600', flexShrink: 1 },
  recommendedBadge: {
    backgroundColor: 'rgba(29,158,117,0.9)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  recommendedBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '600' },
  caption: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontStyle: 'italic' },

  closeButtonSafeArea: { position: 'absolute', top: 0, left: 0 },
  closeButton: {
    marginLeft: 14,
    marginTop: 6,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tagSheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  tagSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  tagSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  tagSheetTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  tagIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagOptionText: { fontSize: 15, fontWeight: '600', color: '#111827' },
});