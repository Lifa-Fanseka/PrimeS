import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { pickAndUploadDocument } from '../MediaService/Upload';
import VideoPlayer from '../components/VideoPlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 390;
const responsive = (size) => Math.round(size * Math.min(Math.max(scale, 0.85), 1.18));

// Cloudinary generates a real video-frame thumbnail automatically
// when you request the video's URL with an image extension instead —
// no separate upload step needed since the video is already stored there.
function getVideoThumbnail(videoUrl) {
  if (!videoUrl) return videoUrl;
  return videoUrl.replace(/\.\w+(\?.*)?$/, '.jpg');
}

const COLORS = {
  cyan: '#06B6D4',
  cyanDark: '#0891B2',
  cyanLight: '#ECFEFF',
  blue: '#3B82F6',
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
  green: '#22C55E',
  yellow: '#FACC15',
  purple: '#A855F7',
};
const AVATAR_PALETTE = ['#06B6D4', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#22C55E', '#EF4444'];
function getInitials(name) {
  if (!name) return '';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
}
function getAvatarColor(name) {
  if (!name) return AVATAR_PALETTE[0];
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}
function formatDate(dateString) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export default function PublicProfileScreen({ navigation, route }) {
  const { type, id, isFollowing: initialIsFollowing } = route.params;
  const [myRole, setMyRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [videoPlaybackUrl, setVideoPlaybackUrl] = useState(null);
  const [isFollowing, setIsFollowing] = useState(!!initialIsFollowing);
  const [followSubmitting, setFollowSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const routeByType = {
    Athlete: `/api/Athlete/GetAthleteById/${id}`,
    Coach: `/api/Coach/GetCoachById/${id}`,
    Scout: `/api/Scout/${id}`,
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const role = await AsyncStorage.getItem('role');
      setMyRole(role);
      if (type === 'Athlete') {
        const [profileRes, statsRes, mediaRes] = await Promise.all([
          api.get(routeByType[type]),
          api.get(`/api/Statistics/GetAthleteStats/${id}`),
          api.get(`/api/Media/GetAthleteMedia/${id}`),
        ]);
        setProfile(profileRes.data);
        setPlayerStats(statsRes.data);
        setHighlights(mediaRes.data.filter((m) => m.fileType === 'Video'));
      } else {
        const res = await api.get(routeByType[type]);
        setProfile(res.data);
      }
      if (role === 'Scout' && type === 'Athlete') {
        api.post(`/api/Scout/view/${id}`).catch((err) => console.error('Failed to record view:', err));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      Alert.alert('Error', 'Could not load this profile.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleToggleFollow = async () => {
    if (!profile?.userId) {
      Alert.alert('Unavailable', 'This account cannot be followed right now.');
      return;
    }
    setFollowSubmitting(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    try {
      if (wasFollowing) {
        await api.delete(`/api/User/Unfollow/${profile.userId}`);
      } else {
        await api.post(`/api/User/follow/${profile.userId}`);
      }
    } catch (err) {
      setIsFollowing(wasFollowing);
      Alert.alert('Error', 'Could not update follow status.');
    } finally {
      setFollowSubmitting(false);
    }
  };

  const handleMessage = () => {
    if (!profile?.userId) {
      Alert.alert('Unavailable', 'This account cannot be messaged right now.');
      return;
    }
    navigation.navigate('Messages', { recipientId: profile.userId, recipientName: profile.name });
  };

  // ---- Send Offer form — same pattern as ScoutDashboardScreen ----
  const [sendOfferModal, setSendOfferModal] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerEventDate, setOfferEventDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [offerLocation, setOfferLocation] = useState('');
  const [offerAttachmentUrl, setOfferAttachmentUrl] = useState('');
  const [offerAttachmentName, setOfferAttachmentName] = useState('');
  const [pickingDocument, setPickingDocument] = useState(false);
  const [documentProgress, setDocumentProgress] = useState(0);
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  const openSendOfferModal = () => {
    setOfferTitle('');
    setOfferEventDate(null);
    setShowDatePicker(false);
    setOfferLocation('');
    setOfferAttachmentUrl('');
    setOfferAttachmentName('');
    setSendOfferModal(true);
  };

  const formatDateForApi = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setOfferEventDate(selectedDate);
    }
  };

  const handlePickDocument = async () => {
    try {
      setPickingDocument(true);
      setDocumentProgress(0);
      const result = await pickAndUploadDocument(setDocumentProgress);
      if (result) {
        setOfferAttachmentUrl(result.url);
        setOfferAttachmentName(result.name);
      }
    } catch (err) {
      Alert.alert('Upload Failed', err?.message || 'Could not upload the document.');
    } finally {
      setPickingDocument(false);
    }
  };

  const submitOffer = async () => {
    if (!offerTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for this offer.');
      return;
    }
    setOfferSubmitting(true);
    try {
      await api.post(`/api/Scout/offers/${id}`, {
        title: offerTitle.trim(),
        eventDate: offerEventDate ? formatDateForApi(offerEventDate) : null,
        location: offerLocation.trim() || null,
        attachmentUrl: offerAttachmentUrl || null,
      });
      Alert.alert('Offer Sent', `Recruitment offer sent to ${profile.name}!`);
      setSendOfferModal(false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not send the offer.');
    } finally {
      setOfferSubmitting(false);
    }
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
      </SafeAreaView>
    );
  }

  const subtitle =
    type === 'Athlete'
      ? `${profile.sport ?? '—'}${profile.position ? ' • ' + profile.position : ''}`
      : type === 'Coach'
      ? profile.affiliation || 'Coach'
      : `${profile.organization ?? 'Scout'}${profile.sportFocus ? ' • ' + profile.sportFocus : ''}`;

  const canSendOffer = myRole === 'Scout' && type === 'Athlete';
  const ratings = playerStats.filter((s) => s.matchRating != null).map((s) => s.matchRating);
  const summaryBoxes = type === 'Athlete' ? [
    { label: 'Goals', value: playerStats.reduce((sum, s) => sum + (s.goals ?? 0), 0) },
    { label: 'Assists', value: playerStats.reduce((sum, s) => sum + (s.assists ?? 0), 0) },
    { label: 'Matches', value: playerStats.length },
    { label: 'Rating', value: ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—' },
  ] : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.75} style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={COLORS.gray700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{type} Profile</Text>
        <View style={{ width: responsive(36) }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileTop}>
          {profile.profilePhoto ? (
            <Image source={{ uri: profile.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(profile.name), alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.avatarInitials}>{getInitials(profile.name)}</Text>
            </View>
          )}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}</Text>
            {type === 'Athlete' && profile.verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={12} color={COLORS.white} />
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {type === 'Athlete' && profile.region ? (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={13} color={COLORS.gray500} />
              <Text style={styles.locationText}>{profile.region}</Text>
            </View>
          ) : null}
          {summaryBoxes.length > 0 && (
            <View style={styles.summaryGrid}>
              {summaryBoxes.map((box) => (
                <View key={box.label} style={styles.summaryCell}>
                  <Text style={styles.summaryValue}>{box.value}</Text>
                  <Text style={styles.summaryLabel}>{box.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity activeOpacity={0.75} style={styles.messageButton} onPress={handleMessage}>
            <Feather name="mail" size={16} color={COLORS.white} />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.followButton, isFollowing && styles.followButtonActive]}
            onPress={handleToggleFollow}
            disabled={followSubmitting}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
        {canSendOffer && (
          <TouchableOpacity activeOpacity={0.75} style={styles.offerButton} onPress={openSendOfferModal}>
            <Feather name="send" size={16} color={COLORS.cyan} />
            <Text style={styles.offerButtonText}>Send Recruitment Offer</Text>
          </TouchableOpacity>
        )}
        {type === 'Athlete' && (
          <View style={styles.tabsContainer}>
            <ProfileTab label="Overview" active={activeTab === 'overview'} onPress={() => setActiveTab('overview')} />
            <ProfileTab label="Stats" active={activeTab === 'stats'} onPress={() => setActiveTab('stats')} />
            <ProfileTab label="Highlights" active={activeTab === 'highlights'} onPress={() => setActiveTab('highlights')} />
          </View>
        )}
        <View style={styles.section}>
          {(type !== 'Athlete' || activeTab === 'overview') && (
            <View>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.aboutText}>{profile.about || 'No bio added yet.'}</Text>
              {type === 'Athlete' && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: responsive(24) }]}>Recent Performance</Text>
                  {playerStats.length === 0 && <Text style={styles.aboutText}>No verified match statistics yet.</Text>}
                  {playerStats.slice(0, 3).map((stat) => (
                    <RecentPerformanceCard key={stat.statId} stat={stat} />
                  ))}
                </>
              )}
            </View>
          )}
          {type === 'Athlete' && activeTab === 'stats' && (
            <View>
              <Text style={styles.sectionTitle}>Match Statistics</Text>
              {playerStats.length === 0 && <Text style={styles.aboutText}>No verified match statistics yet.</Text>}
              {playerStats.map((stat) => (
                <FullStatsCard key={stat.statId} stat={stat} />
              ))}
            </View>
          )}
          {type === 'Athlete' && activeTab === 'highlights' && (
            <View>
              <Text style={styles.sectionTitle}>Video Highlights</Text>
              {highlights.length === 0 && <Text style={styles.aboutText}>No highlight videos yet.</Text>}
              {highlights.map((highlight) => (
                <TouchableOpacity
                  key={highlight.mediaId}
                  activeOpacity={0.75}
                  style={styles.highlightCard}
                  onPress={() => setVideoPlaybackUrl(highlight.fileUrl)}
                >
                  <View style={styles.highlightThumbnail}>
                    <Image source={{ uri: getVideoThumbnail(highlight.fileUrl) }} style={styles.highlightImage} />
                    <View style={styles.highlightOverlay} />
                    <View style={styles.highlightPlayButton}>
                      <Feather name="play" size={22} color={COLORS.cyan} />
                    </View>
                  </View>
                  <View style={styles.highlightInfo}>
                    <Text style={styles.highlightTitle}>{highlight.caption || 'Untitled highlight'}</Text>
                    <View style={styles.highlightMetaRow}>
                      <Text style={styles.highlightDate}>{formatDate(highlight.uploadDate)}</Text>
                      <Text style={styles.highlightViews}>{highlight.likeCount} likes</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <Modal visible={!!videoPlaybackUrl} animationType="fade" onRequestClose={() => setVideoPlaybackUrl(null)}>
        <View style={styles.videoPlaybackScreen}>
          <TouchableOpacity activeOpacity={0.75} style={styles.videoPlaybackClose} onPress={() => setVideoPlaybackUrl(null)}>
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {videoPlaybackUrl && (
            <VideoPlayer uri={videoPlaybackUrl} style={styles.videoPlaybackPlayer} />
          )}
        </View>
      </Modal>

      <Modal
        visible={sendOfferModal}
        animationType="slide"
        transparent
        onRequestClose={() => setSendOfferModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.offerModalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.offerSheet}>
            <View style={styles.offerSheetHandle} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.offerSheetTitle}>Send Recruitment Offer</Text>
              <Text style={styles.offerSheetSubtitle}>To {profile.name}</Text>

              <Text style={styles.offerFieldLabel}>Title</Text>
              <View style={styles.offerFieldRow}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.gray500} style={styles.offerFieldIcon} />
                <TextInput
                  style={styles.offerFieldInput}
                  placeholder="e.g. Official U-19 Summer Trial Invite"
                  placeholderTextColor={COLORS.gray400}
                  value={offerTitle}
                  onChangeText={setOfferTitle}
                />
              </View>

              <Text style={styles.offerFieldLabel}>Event Date</Text>
              <TouchableOpacity
                style={styles.offerFieldRow}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.75}
              >
                <Ionicons name="calendar-outline" size={18} color={COLORS.gray500} style={styles.offerFieldIcon} />
                <Text style={[styles.offerFieldDateText, !offerEventDate && styles.offerFieldPlaceholder]}>
                  {offerEventDate ? formatDateForDisplay(offerEventDate) : 'Select event date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={offerEventDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity style={styles.dateDoneBtn} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.dateDoneBtnText}>Done</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.offerFieldLabel}>Location</Text>
              <View style={styles.offerFieldRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.gray500} style={styles.offerFieldIcon} />
                <TextInput
                  style={styles.offerFieldInput}
                  placeholder="e.g. City Football Academy, Manchester"
                  placeholderTextColor={COLORS.gray400}
                  value={offerLocation}
                  onChangeText={setOfferLocation}
                />
              </View>

              <Text style={styles.offerFieldLabel}>Offer Document (optional)</Text>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={handlePickDocument}
                disabled={pickingDocument}
                activeOpacity={0.75}
              >
                <Ionicons name="attach-outline" size={18} color={COLORS.cyan} />
                {pickingDocument ? (
                  <Text style={styles.attachButtonText}>Uploading... {documentProgress}%</Text>
                ) : offerAttachmentName ? (
                  <Text style={styles.attachButtonText} numberOfLines={1}>{offerAttachmentName}</Text>
                ) : (
                  <Text style={styles.attachButtonText}>Attach Offer Document (PDF)</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitOfferBtn, offerSubmitting && { opacity: 0.7 }]}
                onPress={submitOffer}
                disabled={offerSubmitting}
                activeOpacity={0.85}
              >
                {offerSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitOfferBtnText}>Send Offer</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSendOfferModal(false)} style={styles.cancelOfferBtn}>
                <Text style={styles.cancelOfferBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileTab({ label, active, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.profileTab} onPress={onPress}>
      <Text style={[styles.profileTabText, active && styles.profileTabTextActive]}>{label}</Text>
      {active && <View style={styles.activeTabLine} />}
    </TouchableOpacity>
  );
}
function RecentPerformanceCard({ stat }) {
  return (
    <LinearGradient colors={[COLORS.gray50, COLORS.gray100]} style={styles.recentCard}>
      <View style={styles.recentTopRow}>
        <Text style={styles.recentOpponent}>{stat.opponentTeam ?? 'Unknown'}</Text>
        <View style={styles.matchTypeBadge}>
          <Text style={styles.matchTypeText}>{stat.matchType ?? '—'}</Text>
        </View>
      </View>
      <Text style={styles.statDate}>{formatDate(stat.matchDate)}</Text>
      <View style={styles.recentStatsRow}>
        <MiniStat value={stat.goals ?? 0} label="Goals" />
        <MiniStat value={stat.assists ?? 0} label="Assists" />
        <MiniStat value={stat.minutesPlayed ?? 0} label="Minutes" />
        <MiniStat value={stat.matchRating ?? '—'} label="Rating" />
      </View>
    </LinearGradient>
  );
}
function MiniStat({ value, label }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}
function FullStatsCard({ stat }) {
  return (
    <View style={styles.fullStatsCard}>
      <View style={styles.recentTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recentOpponent}>{stat.opponentTeam ?? 'Unknown'}</Text>
          <Text style={styles.statDate}>{formatDate(stat.matchDate)}</Text>
        </View>
        <View style={styles.blueBadge}>
          <Text style={styles.blueBadgeText}>{stat.matchType ?? '—'}</Text>
        </View>
      </View>
      <View style={styles.fullStatsGrid}>
        <StatsBox icon="target" iconColor={COLORS.cyan} value={stat.goals ?? 0} label="Goals" />
        <StatsBox icon="trending-up" iconColor={COLORS.blue} value={stat.assists ?? 0} label="Assists" />
        <StatsBox icon="clock" iconColor={COLORS.purple} value={stat.minutesPlayed ?? 0} label="Minutes" />
        <StatsBox isStar iconColor={COLORS.yellow} value={stat.matchRating ?? '—'} label="Rating" />
      </View>
    </View>
  );
}
function StatsBox({ icon, iconColor, value, label, isStar = false }) {
  return (
    <View style={styles.statsBox}>
      {isStar ? <Ionicons name="star" size={16} color={iconColor} /> : <Feather name={icon} size={16} color={iconColor} />}
      <Text style={styles.statsBoxValue}>{value}</Text>
      <Text style={styles.statsBoxLabel}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  center: { alignItems: 'center', justifyContent: 'center' },
  videoPlaybackScreen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  videoPlaybackClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaybackPlayer: {
    width: '100%',
    height: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(14),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: { width: responsive(36), height: responsive(36), alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: responsive(16), fontWeight: '700', color: COLORS.black },
  scrollContent: { paddingBottom: responsive(40) },
  profileTop: { alignItems: 'center', paddingTop: responsive(24), paddingHorizontal: responsive(20) },
  avatar: { width: responsive(96), height: responsive(96), borderRadius: responsive(48) },
  avatarInitials: { color: COLORS.white, fontWeight: '700', fontSize: responsive(32) },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: responsive(8), marginTop: responsive(14) },
  name: { fontSize: responsive(21), fontWeight: '800', color: COLORS.black },
  verifiedBadge: {
    width: responsive(20),
    height: responsive(20),
    borderRadius: responsive(10),
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { fontSize: responsive(14), color: COLORS.gray600, marginTop: responsive(4) },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: responsive(4), marginTop: responsive(6) },
  locationText: { fontSize: responsive(13), color: COLORS.gray500 },
  summaryGrid: { flexDirection: 'row', gap: responsive(8), marginTop: responsive(20), width: '100%' },
  summaryCell: { flex: 1, alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: responsive(12), paddingVertical: responsive(12) },
  summaryValue: { fontSize: responsive(17), fontWeight: '800', color: COLORS.black },
  summaryLabel: { fontSize: responsive(11), color: COLORS.gray500, marginTop: responsive(2) },
  actionRow: { flexDirection: 'row', gap: responsive(10), paddingHorizontal: responsive(20), marginTop: responsive(24) },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    gap: responsive(8),
    alignItems: 'center',
    justifyContent: 'center',
    height: responsive(46),
    backgroundColor: COLORS.cyan,
    borderRadius: responsive(23),
  },
  messageButtonText: { color: COLORS.white, fontSize: responsive(14), fontWeight: '700' },
  followButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: responsive(46),
    borderRadius: responsive(23),
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
  },
  followButtonActive: { backgroundColor: COLORS.cyan },
  followButtonText: { color: COLORS.cyan, fontSize: responsive(14), fontWeight: '700' },
  followButtonTextActive: { color: COLORS.white },
  offerButton: {
    flexDirection: 'row',
    gap: responsive(8),
    alignItems: 'center',
    justifyContent: 'center',
    height: responsive(44),
    marginHorizontal: responsive(20),
    marginTop: responsive(12),
    borderRadius: responsive(22),
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    backgroundColor: '#ECFEFF',
  },
  offerButtonText: { color: COLORS.cyan, fontSize: responsive(14), fontWeight: '700' },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: responsive(32),
    marginTop: responsive(28),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    paddingHorizontal: responsive(20),
  },
  profileTab: { paddingBottom: responsive(10) },
  profileTabText: { fontSize: responsive(14), color: COLORS.gray400, fontWeight: '600' },
  profileTabTextActive: { color: COLORS.cyan },
  activeTabLine: { height: 2, backgroundColor: COLORS.cyan, marginTop: responsive(8), borderRadius: 1 },
  section: { paddingHorizontal: responsive(20), marginTop: responsive(20) },
  sectionTitle: { fontSize: responsive(15), fontWeight: '800', color: COLORS.black, marginBottom: responsive(10) },
  aboutText: { fontSize: responsive(14), color: COLORS.gray600, lineHeight: responsive(21) },
  recentCard: { borderRadius: responsive(14), padding: responsive(14), marginBottom: responsive(10) },
  recentTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentOpponent: { fontSize: responsive(14), fontWeight: '700', color: COLORS.black },
  matchTypeBadge: { backgroundColor: COLORS.gray200, borderRadius: responsive(8), paddingHorizontal: responsive(8), paddingVertical: responsive(2) },
  matchTypeText: { fontSize: responsive(11), fontWeight: '600', color: COLORS.gray600 },
  statDate: { fontSize: responsive(12), color: COLORS.gray500, marginTop: responsive(4) },
  recentStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: responsive(12) },
  miniStat: { alignItems: 'center' },
  miniValue: { fontSize: responsive(15), fontWeight: '800', color: COLORS.black },
  miniLabel: { fontSize: responsive(11), color: COLORS.gray500, marginTop: responsive(2) },
  fullStatsCard: { borderWidth: 1, borderColor: COLORS.gray100, borderRadius: responsive(14), padding: responsive(14), marginBottom: responsive(10) },
  blueBadge: { backgroundColor: COLORS.cyanLight, borderRadius: responsive(8), paddingHorizontal: responsive(8), paddingVertical: responsive(2) },
  blueBadgeText: { fontSize: responsive(11), fontWeight: '700', color: COLORS.cyanDark },
  fullStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: responsive(14) },
  statsBox: { alignItems: 'center', gap: responsive(4) },
  statsBoxValue: { fontSize: responsive(15), fontWeight: '800', color: COLORS.black },
  statsBoxLabel: { fontSize: responsive(11), color: COLORS.gray500 },
  highlightCard: { flexDirection: 'row', gap: responsive(12), marginBottom: responsive(14) },
  highlightThumbnail: { width: responsive(120), height: responsive(80), borderRadius: responsive(12), overflow: 'hidden', position: 'relative' },
  highlightImage: { width: '100%', height: '100%' },
  highlightOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  highlightPlayButton: { position: 'absolute', top: '50%', left: '50%', marginLeft: responsive(-16), marginTop: responsive(-16), width: responsive(32), height: responsive(32), borderRadius: responsive(16), backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  highlightInfo: { flex: 1, justifyContent: 'center' },
  highlightTitle: { fontSize: responsive(14), fontWeight: '700', color: COLORS.black },
  highlightMetaRow: { flexDirection: 'row', gap: responsive(10), marginTop: responsive(6) },
  highlightDate: { fontSize: responsive(11), color: COLORS.gray500 },
  highlightViews: { fontSize: responsive(11), color: COLORS.gray500 },
  offerModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  offerSheet: {
    maxHeight: '88%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: responsive(20),
    borderTopRightRadius: responsive(20),
    paddingHorizontal: responsive(20),
    paddingTop: responsive(10),
    paddingBottom: Platform.OS === 'ios' ? responsive(30) : responsive(20),
  },
  offerSheetHandle: {
    width: responsive(40),
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
    alignSelf: 'center',
    marginBottom: responsive(14),
  },
  offerSheetTitle: { fontSize: responsive(18), fontWeight: '800', color: COLORS.black },
  offerSheetSubtitle: { fontSize: responsive(13), color: COLORS.gray500, marginTop: responsive(2), marginBottom: responsive(16) },
  offerFieldLabel: { fontSize: responsive(13), fontWeight: '700', color: COLORS.gray700, marginBottom: responsive(6) },
  offerFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: responsive(10),
    paddingHorizontal: responsive(12),
    marginBottom: responsive(14),
  },
  offerFieldIcon: { marginRight: responsive(8) },
  offerFieldInput: { flex: 1, height: responsive(46), fontSize: responsive(14), color: COLORS.black },
  offerFieldDateText: { flex: 1, fontSize: responsive(14), color: COLORS.black, paddingVertical: responsive(14) },
  offerFieldPlaceholder: { color: COLORS.gray400 },
  dateDoneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(8),
    marginBottom: responsive(14),
  },
  dateDoneBtnText: { fontSize: responsive(14), fontWeight: '700', color: COLORS.cyan },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(8),
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    borderStyle: 'dashed',
    borderRadius: responsive(10),
    paddingVertical: responsive(12),
    paddingHorizontal: responsive(14),
    marginBottom: responsive(20),
  },
  attachButtonText: { flex: 1, fontSize: responsive(13), fontWeight: '600', color: COLORS.cyan },
  submitOfferBtn: {
    height: responsive(50),
    backgroundColor: COLORS.cyan,
    borderRadius: responsive(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitOfferBtnText: { fontSize: responsive(15), fontWeight: '700', color: COLORS.white },
  cancelOfferBtn: { alignItems: 'center', paddingVertical: responsive(14) },
  cancelOfferBtnText: { fontSize: responsive(14), fontWeight: '600', color: COLORS.gray500 },
});