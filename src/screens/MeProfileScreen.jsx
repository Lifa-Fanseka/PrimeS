import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  Dimensions,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { pickAndUploadImage, pickAndUploadVideo } from '../MediaService/Upload';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  red: '#EF4444',
};
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1080';

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}
function getInitials(name) {
  if (!name) return '';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
}
const AVATAR_PALETTE = ['#06B6D4', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#22C55E', '#EF4444'];
function getAvatarColor(name) {
  if (!name) return AVATAR_PALETTE[0];
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}

export default function ProfileScreen({ navigation }) {
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [availableMatches, setAvailableMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [uploadForm, setUploadForm] = useState({ fileUrl: '', caption: '' });
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [statsForm, setStatsForm] = useState({ goals: '', assists: '', minutesPlayed: '', rating: '' });
  const [statsSubmitting, setStatsSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const currentRole = await AsyncStorage.getItem('role');
      setRole(currentRole);
      if (currentRole === 'Athlete') {
        const [profileRes, statsRes, mediaRes] = await Promise.all([
          api.get('/api/Athlete/GetProfile'),
          api.get('/api/Statistics/GetMyStats'),
          api.get('/api/Media/me'),
        ]);
        const p = profileRes.data;
        setProfile(p);
        setPlayerStats(statsRes.data);
        setHighlights(mediaRes.data.filter((m) => m.fileType === 'Video'));
        const verified = statsRes.data.filter((s) => s.verified);
        const ratings = verified.filter((s) => s.matchRating != null).map((s) => s.matchRating);
        setStats({
          boxes: [
            { label: 'Goals', value: verified.reduce((sum, s) => sum + (s.goals ?? 0), 0) },
            { label: 'Assists', value: verified.reduce((sum, s) => sum + (s.assists ?? 0), 0) },
            { label: 'Matches', value: verified.length },
            { label: 'Rating', value: ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—' },
          ],
        });
        setEditForm({
          name: p.name ?? '',
          sport: p.sport ?? '',
          position: p.position ?? '',
          region: p.region ?? '',
          about: p.about ?? '',
        });
      } else if (currentRole === 'Coach') {
        const res = await api.get('/api/Coach/GetCoachProfile');
        const p = res.data;
        setProfile(p);
        setStats({
          boxes: [
            { label: 'Matches Played', value: p.matchesPlayed ?? 0 },
            { label: 'Wins', value: p.wins ?? 0 },
            { label: 'Draws', value: p.draws ?? 0 },
            { label: 'Rating', value: p.rating != null ? p.rating.toFixed(1) : '—' },
          ],
        });
        setEditForm({
          name: p.name ?? '',
          affiliation: p.affiliation ?? '',
          about: p.about ?? '',
        });
      } else if (currentRole === 'Scout') {
        const [profileRes, dashboardRes] = await Promise.all([
          api.get('/api/Scout/me'),
          api.get('/api/Scout/dashboard'),
        ]);
        const p = profileRes.data;
        setProfile(p);
        setStats({
          boxes: [
            { label: 'Scouted', value: dashboardRes.data.scoutedCount ?? 0 },
            { label: 'Favorites', value: dashboardRes.data.favoritesCount ?? 0 },
            { label: 'Recruited', value: dashboardRes.data.recruitedCount ?? 0 },
          ],
        });
        setEditForm({
          name: p.name ?? '',
          organization: p.organization ?? '',
          sportFocus: p.sportFocus ?? '',
          contactInfo: p.contactInfo ?? '',
          about: p.about ?? '',
        });
      } else if (currentRole === 'Parent') {
        const res = await api.get('/api/Parent/me');
        const p = res.data;
        setProfile(p);
        setStats(null); // Parents have no performance stats
        setEditForm({
          name: p.name ?? '',
          contactInfo: p.contactInfo ?? '',
        });
      } else if (currentRole === 'LeagueAdmin') {
        const res = await api.get('/api/LeagueAdmin/me');
        const p = res.data;
        setProfile(p);
        setStats(null); // League Admins have no performance stats
        setEditForm({
          name: p.name ?? '',
          organization: p.organization ?? '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      Alert.alert('Error', 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateEditForm = (field, value) => setEditForm((prev) => ({ ...prev, [field]: value }));

  const handleSaveProfile = async () => {
    setEditSubmitting(true);
    try {
      if (role === 'Athlete') {
        await api.put('/api/Athlete/UpdateProfile', {
          name: editForm.name,
          sport: editForm.sport,
          position: editForm.position,
          about: editForm.about,
          region: editForm.region,
        });
      } else if (role === 'Coach') {
        await api.put('/api/Coach/UpdateCoachProfile', {
          name: editForm.name,
          affiliation: editForm.affiliation,
          about: editForm.about,
        });
      } else if (role === 'Scout') {
        await api.put('/api/Scout/me', {
          name: editForm.name,
          organization: editForm.organization,
          sportFocus: editForm.sportFocus,
          contactInfo: editForm.contactInfo,
          about: editForm.about,
        });
      } else if (role === 'Parent') {
        await api.put('/api/Parent/me', {
          name: editForm.name,
          contactInfo: editForm.contactInfo,
        });
      } else if (role === 'LeagueAdmin') {
        await api.put('/api/LeagueAdmin/me', {
          name: editForm.name,
          organization: editForm.organization,
        });
      }
      Alert.alert('Saved', 'Profile updated!');
      setShowEditModal(false);
      loadAll();
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not update profile.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const openPhotoModal = () => {
    setPhotoUrlInput(profile?.profilePhoto ?? '');
    setShowPhotoModal(true);
  };

  const submitPhoto = async () => {
    if (!photoUrlInput.trim()) {
      Alert.alert('Missing URL', "Paste a photo URL to continue (real upload isn't wired up yet).");
      return;
    }
    setPhotoSubmitting(true);
    try {
      const routeByRole = {
        Athlete: '/api/Athlete/me/photo',
        Coach: '/api/Coach/me/photo',
        Scout: '/api/Scout/me/photo',
      };
      await api.put(routeByRole[role], { profilePhoto: photoUrlInput.trim() });
      setShowPhotoModal(false);
      loadAll();
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not update photo.');
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const updateUploadForm = (field, value) => setUploadForm((prev) => ({ ...prev, [field]: value }));

  const handleUploadHighlight = async () => {
    if (!uploadForm.fileUrl.trim()) {
      Alert.alert('Missing URL', "Paste a video URL to continue (real upload isn't wired up yet).");
      return;
    }
    setUploadSubmitting(true);
    try {
      await api.post('/api/Media', {
        fileType: 'Video',
        fileUrl: uploadForm.fileUrl.trim(),
        caption: uploadForm.caption.trim() || null,
      });
      setUploadForm({ fileUrl: '', caption: '' });
      setShowUploadModal(false);
      Alert.alert('Submitted for Review', 'Your video has been sent to your coach for verification.');
      loadAll();
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not upload highlight.');
    } finally {
      setUploadSubmitting(false);
    }
  };

  const updateStatsForm = (field, value) => setStatsForm((prev) => ({ ...prev, [field]: value }));

  const openStatsModal = async () => {
    setShowStatsModal(true);
    setSelectedMatchId(null);
    setStatsForm({ goals: '', assists: '', minutesPlayed: '', rating: '' });
    try {
      const res = await api.get('/api/Match/GetAthleteTeamMatches');
      setAvailableMatches(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load your matches.');
    }
  };

  const handleSaveStats = async () => {
    if (!selectedMatchId) {
      Alert.alert('Select a Match', 'Please select which match these stats are for.');
      return;
    }
    setStatsSubmitting(true);
    try {
      await api.post('/api/Statistics/AddStats', {
        matchId: selectedMatchId,
        goals: statsForm.goals ? Number(statsForm.goals) : null,
        assists: statsForm.assists ? Number(statsForm.assists) : null,
        minutesPlayed: statsForm.minutesPlayed ? Number(statsForm.minutesPlayed) : null,
        matchRating: statsForm.rating ? Number(statsForm.rating) : null,
      });
      setShowStatsModal(false);
      Alert.alert('Stats Submitted', 'Your statistics will be sent to your coach for verification.');
      loadAll();
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not submit statistics.');
    } finally {
      setStatsSubmitting(false);
    }
  };

  const dashboardByRole = {
    Athlete: 'AthleteDashboard',
    Coach: 'CoachDashboard',
    Scout: 'ScoutDashboard',
    Parent: 'ParentDashboard',
    LeagueAdmin: 'LeagueAdminDashboard',
  };

  const handleBottomNav = (tabId, screenName) => {
    if (tabId === 'me') return;
    navigation.navigate(screenName);
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerLoading]}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
      </SafeAreaView>
    );
  }

  const subtitle =
    role === 'Athlete'
      ? `${profile.sport ?? '—'} • ${profile.position ?? '—'}`
      : role === 'Coach'
      ? profile.affiliation || 'Coach'
      : role === 'Scout'
      ? `${profile.organization ?? 'Scout'}${profile.sportFocus ? ' • ' + profile.sportFocus : ''}`
      : role === 'LeagueAdmin'
      ? profile.organization || 'League Administrator'
      : 'Parent';

  const location = role === 'Athlete' ? profile.region : null;
  const canEditPhoto = role !== 'Parent' && role !== 'LeagueAdmin'; // no photo endpoint exists for either

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.floatingHeader}>
          <TouchableOpacity activeOpacity={0.75} style={styles.floatingButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={COLORS.gray700} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.75} style={styles.floatingButton} onPress={() => navigation.navigate('Settings')}>
            <Feather name="settings" size={20} color={COLORS.gray700} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.coverContainer}>
            <Image source={{ uri: DEFAULT_COVER }} style={styles.coverImage} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.3)']} style={styles.coverOverlay} />
          </View>
          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              {profile.profilePhoto ? (
                <Image source={{ uri: profile.profilePhoto }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, { backgroundColor: getAvatarColor(profile.name), alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={styles.initialsText}>{getInitials(profile.name)}</Text>
                </View>
              )}
              {canEditPhoto && (
                <TouchableOpacity activeOpacity={0.75} style={styles.avatarCamera} onPress={openPhotoModal}>
                  <Feather name="camera" size={12} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{profile.name}</Text>
              {profile.verified && (
                <View style={styles.verifiedCircle}>
                  <Feather name="check" size={12} color={COLORS.white} />
                </View>
              )}
            </View>
            <Text style={styles.sportLine}>{subtitle}</Text>
            {location ? (
              <View style={styles.infoLine}>
                <Feather name="map-pin" size={14} color={COLORS.gray500} />
                <Text style={styles.infoLineText}>{location}</Text>
              </View>
            ) : null}
            {role === 'Parent' && profile.contactInfo ? (
              <View style={styles.infoLine}>
                <Feather name="phone" size={14} color={COLORS.gray500} />
                <Text style={styles.infoLineText}>{profile.contactInfo}</Text>
              </View>
            ) : null}
            {stats && (
              <View style={styles.performanceGrid}>
                {stats.boxes.map((box) => (
                  <View key={box.label} style={styles.performanceCell}>
                    <Text style={styles.performanceValue}>{box.value}</Text>
                    <Text style={styles.performanceLabel}>{box.label}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity activeOpacity={0.75} style={styles.editButton} onPress={() => setShowEditModal(true)}>
                <Feather name="edit-2" size={18} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              {role === 'Athlete' && (
                <TouchableOpacity activeOpacity={0.75} style={styles.statsButton} onPress={openStatsModal}>
                  <Feather name="upload" size={18} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Upload Stats</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {role === 'Athlete' && (
            <View style={styles.tabsContainer}>
              <ProfileTab label="Overview" active={activeTab === 'overview'} onPress={() => setActiveTab('overview')} />
              <ProfileTab label="Stats" active={activeTab === 'stats'} onPress={() => setActiveTab('stats')} />
              <ProfileTab label="Highlights" active={activeTab === 'highlights'} onPress={() => setActiveTab('highlights')} />
            </View>
          )}
          <View style={styles.tabContent}>
            {role !== 'Parent' && role !== 'LeagueAdmin' && (role !== 'Athlete' || activeTab === 'overview') && (
              <View>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.aboutText}>
                  {profile.about || 'No bio added yet.'}
                </Text>
                {role === 'Athlete' && (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>Recent Performance</Text>
                      <TouchableOpacity activeOpacity={0.75} style={styles.smallAction} onPress={openStatsModal}>
                        <Feather name="plus" size={13} color={COLORS.cyan} />
                        <Text style={styles.smallActionText}>Add Stats</Text>
                      </TouchableOpacity>
                    </View>
                    {playerStats.length === 0 && <Text style={styles.aboutText}>No match statistics yet.</Text>}
                    {playerStats.slice(0, 3).map((stat) => (
                      <RecentPerformanceCard key={stat.statId} stat={stat} />
                    ))}
                  </>
                )}
              </View>
            )}
            {role === 'Athlete' && activeTab === 'stats' && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Match Statistics</Text>
                  <TouchableOpacity activeOpacity={0.75} style={styles.smallAction} onPress={openStatsModal}>
                    <Feather name="plus" size={13} color={COLORS.cyan} />
                    <Text style={styles.smallActionText}>Add Stats</Text>
                  </TouchableOpacity>
                </View>
                {playerStats.length === 0 && <Text style={styles.aboutText}>No match statistics yet.</Text>}
                {playerStats.map((stat) => (
                  <FullStatsCard key={stat.statId} stat={stat} />
                ))}
              </View>
            )}
            {role === 'Athlete' && activeTab === 'highlights' && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Video Highlights</Text>
                  <TouchableOpacity activeOpacity={0.75} style={styles.smallAction} onPress={() => setShowUploadModal(true)}>
                    <Feather name="upload" size={14} color={COLORS.cyan} />
                    <Text style={styles.smallActionText}>Upload</Text>
                  </TouchableOpacity>
                </View>
                {highlights.length === 0 && <Text style={styles.aboutText}>No highlight videos yet.</Text>}
                {highlights.map((highlight) => (
                  <TouchableOpacity
                    key={highlight.mediaId}
                    activeOpacity={0.75}
                    style={styles.highlightCard}
                    onPress={() => {
                      setSelectedHighlight(highlight);
                      setShowVideoModal(true);
                    }}
                  >
                    <View style={styles.highlightThumbnail}>
                      <Image source={{ uri: getVideoThumbnail(highlight.fileUrl) }} style={styles.highlightImage} />
                      <View style={styles.highlightOverlay} />
                      <View style={styles.highlightPlayButton}>
                        <Feather name="play" size={22} color={COLORS.cyan} />
                      </View>
                      {highlight.verified ? (
                        <View style={styles.highlightVerified}>
                          <Feather name="check" size={10} color={COLORS.white} />
                          <Text style={styles.highlightVerifiedText}>Verified</Text>
                        </View>
                      ) : (
                        <View style={[styles.highlightVerified, { backgroundColor: '#F59E0B' }]}>
                          <Text style={styles.highlightVerifiedText}>Pending</Text>
                        </View>
                      )}
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
        <View style={styles.bottomNav}>
          <BottomTab icon="home" label="Home" onPress={() => handleBottomNav('home', dashboardByRole[role] ?? 'Startup')} />
          <BottomTab icon="users" label="Network" onPress={() => handleBottomNav('network', 'Network')} />
          <BottomTab icon="message-circle" label="Messages" onPress={() => handleBottomNav('messages', 'Messages')} />
          <BottomTab icon="bell" label="Notifications" onPress={() => handleBottomNav('notifications', 'Notifications')} />
          <BottomTab icon="user" label="Me" active onPress={() => handleBottomNav('me', 'Profile')} />
        </View>
        <EditProfileModal
          visible={showEditModal}
          role={role}
          onClose={() => setShowEditModal(false)}
          editForm={editForm}
          updateEditForm={updateEditForm}
          onSave={handleSaveProfile}
          submitting={editSubmitting}
        />
        {canEditPhoto && (
          <PhotoModal
            visible={showPhotoModal}
            onClose={() => setShowPhotoModal(false)}
            url={photoUrlInput}
            setUrl={setPhotoUrlInput}
            submitting={photoSubmitting}
            onSubmit={submitPhoto}
          />
        )}
        {role === 'Athlete' && (
          <>
            <UploadHighlightModal
              visible={showUploadModal}
              onClose={() => setShowUploadModal(false)}
              uploadForm={uploadForm}
              updateUploadForm={updateUploadForm}
              onUpload={handleUploadHighlight}
              submitting={uploadSubmitting}
            />
            <AddStatsModal
              visible={showStatsModal}
              onClose={() => setShowStatsModal(false)}
              matches={availableMatches}
              selectedMatchId={selectedMatchId}
              setSelectedMatchId={setSelectedMatchId}
              statsForm={statsForm}
              updateStatsForm={updateStatsForm}
              onSave={handleSaveStats}
              submitting={statsSubmitting}
            />
            <VideoPreviewModal
              visible={showVideoModal}
              highlight={selectedHighlight}
              onClose={() => {
                setShowVideoModal(false);
                setSelectedHighlight(null);
              }}
            />
          </>
        )}
      </View>
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
      <Text style={styles.statDate}>
        {formatDate(stat.matchDate)} {!stat.verified && '• Pending verification'}
      </Text>
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
          <Text style={styles.statDate}>
            {formatDate(stat.matchDate)} {!stat.verified && '• Pending verification'}
          </Text>
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
function BottomTab({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.bottomTab} onPress={onPress}>
      <Feather name={icon} size={24} color={active ? COLORS.cyan : COLORS.gray500} />
      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
function FormInput({ label, value, onChangeText, placeholder, multiline = false }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && styles.formTextArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray400}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}
function BottomSheet({ visible, onClose, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.bottomSheet}>
          <View style={styles.modalHandle} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
function EditProfileModal({ visible, role, onClose, editForm, updateEditForm, onSave, submitting }) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <TouchableOpacity activeOpacity={0.75} style={styles.modalClose} onPress={onClose}>
        <Feather name="x" size={20} color={COLORS.gray600} />
      </TouchableOpacity>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalTitle}>Edit Profile</Text>
        <FormInput label="Full Name" value={editForm.name} onChangeText={(t) => updateEditForm('name', t)} placeholder="Full name" />
        {role === 'Athlete' && (
          <>
            <FormInput label="Sport" value={editForm.sport} onChangeText={(t) => updateEditForm('sport', t)} placeholder="Sport" />
            <FormInput label="Position" value={editForm.position} onChangeText={(t) => updateEditForm('position', t)} placeholder="Position" />
            <FormInput label="Region / Location" value={editForm.region} onChangeText={(t) => updateEditForm('region', t)} placeholder="e.g. Johannesburg" />
          </>
        )}
        {role === 'Coach' && (
          <FormInput label="Affiliation / Title" value={editForm.affiliation} onChangeText={(t) => updateEditForm('affiliation', t)} placeholder="e.g. Head Coach" />
        )}
        {role === 'Scout' && (
          <>
            <FormInput label="Organization" value={editForm.organization} onChangeText={(t) => updateEditForm('organization', t)} placeholder="e.g. FC Barcelona" />
            <FormInput label="Sport Focus" value={editForm.sportFocus} onChangeText={(t) => updateEditForm('sportFocus', t)} placeholder="e.g. Football" />
            <FormInput label="Contact Info" value={editForm.contactInfo} onChangeText={(t) => updateEditForm('contactInfo', t)} placeholder="Email or phone" />
          </>
        )}
        {role === 'Parent' && (
          <FormInput label="Contact Info" value={editForm.contactInfo} onChangeText={(t) => updateEditForm('contactInfo', t)} placeholder="Email or phone" />
        )}
        {role === 'LeagueAdmin' && (
          <FormInput label="Organization" value={editForm.organization} onChangeText={(t) => updateEditForm('organization', t)} placeholder="e.g. Gauteng Youth League" />
        )}
        {role !== 'Parent' && role !== 'LeagueAdmin' && (
          <FormInput label="About / Bio" value={editForm.about} onChangeText={(t) => updateEditForm('about', t)} placeholder="Write about yourself" multiline />
        )}
        <TouchableOpacity activeOpacity={0.75} style={[styles.saveButton, submitting && { opacity: 0.7 }]} onPress={onSave} disabled={submitting}>
          {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}
function PhotoModal({ visible, onClose, url, setUrl, submitting, onSubmit }) {
  const [picking, setPicking] = useState(false);
  const [progress, setProgress] = useState(0);
  const handleChoosePhoto = async () => {
    try {
      setPicking(true);
      setProgress(0);
      const secureUrl = await pickAndUploadImage(setProgress);
      if (secureUrl) setUrl(secureUrl);
    } catch (err) {
      Alert.alert('Upload Failed', err?.message || 'Could not upload photo.');
    } finally {
      setPicking(false);
    }
  };
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.modalTitle}>Update Profile Photo</Text>
      {url ? <Image source={{ uri: url }} style={styles.photoPreview} /> : null}
      <TouchableOpacity activeOpacity={0.75} style={styles.chooseButton} onPress={handleChoosePhoto} disabled={picking}>
        {picking ? (
          <Text style={styles.chooseButtonText}>Uploading... {progress}%</Text>
        ) : (
          <Text style={styles.chooseButtonText}>{url ? 'Choose Different Photo' : 'Choose Photo'}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.75}
        style={[styles.saveButton, (submitting || !url) && { opacity: 0.5 }]}
        onPress={onSubmit}
        disabled={submitting || !url}
      >
        {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Save Photo</Text>}
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.75} style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}
function UploadHighlightModal({ visible, onClose, uploadForm, updateUploadForm, onUpload, submitting }) {
  const [picking, setPicking] = useState(false);
  const [progress, setProgress] = useState(0);
  const handleChooseVideo = async () => {
    try {
      setPicking(true);
      setProgress(0);
      const secureUrl = await pickAndUploadVideo(setProgress);
      if (secureUrl) updateUploadForm('fileUrl', secureUrl);
    } catch (err) {
      Alert.alert('Upload Failed', err?.message || 'Could not upload video.');
    } finally {
      setPicking(false);
    }
  };
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalTitle}>Upload Highlight Video</Text>
        <TouchableOpacity activeOpacity={0.75} style={styles.chooseButton} onPress={handleChooseVideo} disabled={picking}>
          {picking ? (
            <Text style={styles.chooseButtonText}>Uploading... {progress}%</Text>
          ) : (
            <Text style={styles.chooseButtonText}>
              {uploadForm.fileUrl ? 'Video Selected — Choose Different' : 'Choose Video'}
            </Text>
          )}
        </TouchableOpacity>
        <FormInput label="Caption" value={uploadForm.caption} onChangeText={(t) => updateUploadForm('caption', t)} placeholder="Amazing Goal vs Cape Town" multiline />
        <TouchableOpacity
          activeOpacity={0.75}
          style={[styles.saveButton, (submitting || !uploadForm.fileUrl) && { opacity: 0.5 }]}
          onPress={onUpload}
          disabled={submitting || !uploadForm.fileUrl}
        >
          {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Upload Highlight</Text>}
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}
function AddStatsModal({ visible, onClose, matches, selectedMatchId, setSelectedMatchId, statsForm, updateStatsForm, onSave, submitting }) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalTitle}>Add Match Stats</Text>
        <Text style={styles.formLabel}>Select Match</Text>
        {matches.length === 0 ? (
          <Text style={styles.uploadNote}>No matches available. Ask your coach to add one, or join a team first.</Text>
        ) : (
          matches.map((m) => (
            <TouchableOpacity
              key={m.matchId}
              activeOpacity={0.75}
              style={[styles.matchOption, selectedMatchId === m.matchId && styles.matchOptionSelected]}
              onPress={() => setSelectedMatchId(m.matchId)}
            >
              <Text style={styles.recentOpponent}>vs {m.opponentTeam ?? 'Unknown'} ({m.matchType ?? '—'})</Text>
              <Text style={styles.statDate}>{formatDate(m.matchDate)}</Text>
            </TouchableOpacity>
          ))
        )}
        <FormInput label="Goals" value={statsForm.goals} onChangeText={(t) => updateStatsForm('goals', t)} placeholder="0" />
        <FormInput label="Assists" value={statsForm.assists} onChangeText={(t) => updateStatsForm('assists', t)} placeholder="0" />
        <FormInput label="Minutes Played" value={statsForm.minutesPlayed} onChangeText={(t) => updateStatsForm('minutesPlayed', t)} placeholder="90" />
        <FormInput label="Match Rating" value={statsForm.rating} onChangeText={(t) => updateStatsForm('rating', t)} placeholder="8.5" />
        <TouchableOpacity activeOpacity={0.75} style={[styles.blueSaveButton, submitting && { opacity: 0.7 }]} onPress={onSave} disabled={submitting}>
          {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Save Stats</Text>}
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}
function VideoPreviewModal({ visible, highlight, onClose }) {
  if (!highlight) return null;
  return (
    <Modal visible={visible} animationType="fade">
      <View style={styles.videoModal}>
        <TouchableOpacity activeOpacity={0.75} style={styles.videoClose} onPress={onClose}>
          <Feather name="x" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.videoPreviewContent}>
          <View style={styles.videoImageWrap}>
            <VideoPlayer uri={highlight.fileUrl} style={styles.videoPreviewImage} />
          </View>
          <Text style={styles.videoTitle}>{highlight.caption || 'Untitled highlight'}</Text>
          <Text style={styles.videoMeta}>{formatDate(highlight.uploadDate)} • {highlight.likeCount} likes</Text>
          {highlight.verified && (
            <View style={styles.videoVerifiedBadge}>
              <Feather name="check" size={12} color={COLORS.white} />
              <Text style={styles.videoVerifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1 },
  centerLoading: { alignItems: 'center', justifyContent: 'center' },
  floatingHeader: {
    position: 'absolute',
    top: responsive(16),
    left: responsive(16),
    right: responsive(16),
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floatingButton: {
    width: responsive(38),
    height: responsive(38),
    borderRadius: responsive(19),
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingBottom: responsive(40) },
  coverContainer: { height: responsive(160), position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverOverlay: { ...StyleSheet.absoluteFillObject },
  profileCard: { paddingHorizontal: responsive(20), marginTop: responsive(-48) },
  avatarWrapper: { alignSelf: 'flex-start', position: 'relative' },
  profileImage: {
    width: responsive(96),
    height: responsive(96),
    borderRadius: responsive(48),
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  initialsText: { color: COLORS.white, fontWeight: '700', fontSize: responsive(32) },
  avatarCamera: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: responsive(28),
    height: responsive(28),
    borderRadius: responsive(14),
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: responsive(8), marginTop: responsive(12) },
  profileName: { fontSize: responsive(22), fontWeight: '800', color: COLORS.black },
  verifiedCircle: {
    width: responsive(20),
    height: responsive(20),
    borderRadius: responsive(10),
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportLine: { fontSize: responsive(14), color: COLORS.gray600, marginTop: responsive(4) },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: responsive(4), marginTop: responsive(4) },
  infoLineText: { fontSize: responsive(13), color: COLORS.gray500 },
  performanceGrid: { flexDirection: 'row', marginTop: responsive(18), gap: responsive(8) },
  performanceCell: { flex: 1, alignItems: 'center', backgroundColor: COLORS.gray50, borderRadius: responsive(12), paddingVertical: responsive(12) },
  performanceValue: { fontSize: responsive(18), fontWeight: '800', color: COLORS.black },
  performanceLabel: { fontSize: responsive(11), color: COLORS.gray500, marginTop: responsive(2) },
  actionButtonsRow: { flexDirection: 'row', gap: responsive(10), marginTop: responsive(18) },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    gap: responsive(8),
    alignItems: 'center',
    justifyContent: 'center',
    height: responsive(46),
    backgroundColor: COLORS.gray700,
    borderRadius: responsive(23),
  },
  statsButton: {
    flex: 1,
    flexDirection: 'row',
    gap: responsive(8),
    alignItems: 'center',
    justifyContent: 'center',
    height: responsive(46),
    backgroundColor: COLORS.cyan,
    borderRadius: responsive(23),
  },
  actionButtonText: { color: COLORS.white, fontSize: responsive(14), fontWeight: '700' },
  tabsContainer: { flexDirection: 'row', marginTop: responsive(24), borderBottomWidth: 1, borderBottomColor: COLORS.gray100, paddingHorizontal: responsive(20) },
  profileTab: { marginRight: responsive(24), paddingBottom: responsive(10) },
  profileTabText: { fontSize: responsive(14), color: COLORS.gray400, fontWeight: '600' },
  profileTabTextActive: { color: COLORS.cyan },
  activeTabLine: { height: 2, backgroundColor: COLORS.cyan, marginTop: responsive(8), borderRadius: 1 },
  tabContent: { paddingHorizontal: responsive(20), paddingTop: responsive(20) },
  sectionTitle: { fontSize: responsive(16), fontWeight: '800', color: COLORS.black, marginBottom: responsive(10) },
  aboutText: { fontSize: responsive(14), color: COLORS.gray600, lineHeight: responsive(21) },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: responsive(24), marginBottom: responsive(10) },
  smallAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallActionText: { fontSize: responsive(13), fontWeight: '700', color: COLORS.cyan },
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
  highlightVerified: { position: 'absolute', top: responsive(6), left: responsive(6), flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.green, borderRadius: responsive(8), paddingHorizontal: responsive(6), paddingVertical: responsive(2) },
  highlightVerifiedText: { fontSize: responsive(9), fontWeight: '700', color: COLORS.white },
  highlightInfo: { flex: 1, justifyContent: 'center' },
  highlightTitle: { fontSize: responsive(14), fontWeight: '700', color: COLORS.black },
  highlightMetaRow: { flexDirection: 'row', gap: responsive(10), marginTop: responsive(6) },
  highlightDate: { fontSize: responsive(11), color: COLORS.gray500 },
  highlightViews: { fontSize: responsive(11), color: COLORS.gray500 },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: responsive(8), paddingBottom: responsive(20) },
  bottomTab: { flex: 1, alignItems: 'center', gap: responsive(2) },
  bottomLabel: { fontSize: responsive(11), color: COLORS.gray500 },
  bottomLabelActive: { color: COLORS.cyan, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: responsive(24), borderTopRightRadius: responsive(24), padding: responsive(20), maxHeight: '85%' },
  modalHandle: { width: responsive(40), height: 4, borderRadius: 2, backgroundColor: COLORS.gray300, alignSelf: 'center', marginBottom: responsive(16) },
  modalClose: { position: 'absolute', top: responsive(16), right: responsive(16), zIndex: 10 },
  modalTitle: { fontSize: responsive(18), fontWeight: '800', color: COLORS.black, marginBottom: responsive(16) },
  uploadNote: { fontSize: responsive(12), color: COLORS.gray500, marginBottom: responsive(12) },
  photoPreview: {
    width: responsive(96),
    height: responsive(96),
    borderRadius: responsive(48),
    alignSelf: 'center',
    marginBottom: responsive(14),
  },
  chooseButton: {
    height: responsive(48),
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    borderRadius: responsive(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsive(8),
  },
  chooseButtonText: {
    color: COLORS.cyan,
    fontSize: responsive(14),
    fontWeight: '700',
  },
  formField: {
    marginBottom: responsive(14),
  },
  formLabel: {
    fontSize: responsive(13),
    fontWeight: '700',
    color: COLORS.gray700,
    marginBottom: responsive(6),
  },
  formInput: {
    height: responsive(46),
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: responsive(10),
    paddingHorizontal: responsive(14),
    fontSize: responsive(14),
    color: COLORS.black,
  },
  formTextArea: { height: responsive(90), paddingTop: responsive(12) },
  matchOption: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: responsive(10), padding: responsive(12), marginBottom: responsive(8) },
  matchOptionSelected: { borderColor: COLORS.cyan, backgroundColor: COLORS.cyanLight },
  saveButton: { height: responsive(48), backgroundColor: COLORS.cyan, borderRadius: responsive(24), alignItems: 'center', justifyContent: 'center', marginTop: responsive(8) },
  blueSaveButton: { height: responsive(48), backgroundColor: COLORS.blue, borderRadius: responsive(24), alignItems: 'center', justifyContent: 'center', marginTop: responsive(8) },
  saveButtonText: { color: COLORS.white, fontSize: responsive(15), fontWeight: '700' },
  cancelButton: { alignItems: 'center', paddingVertical: responsive(14) },
  cancelText: { color: COLORS.gray500, fontSize: responsive(14), fontWeight: '600' },
  videoModal: { flex: 1, backgroundColor: COLORS.black },
  videoClose: { position: 'absolute', top: responsive(50), right: responsive(20), zIndex: 10 },
  videoPreviewContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: responsive(24) },
  videoImageWrap: { width: '100%', aspectRatio: 16 / 9, borderRadius: responsive(14), overflow: 'hidden', position: 'relative' },
  videoPreviewImage: { width: '100%', height: '100%' },
  videoPreviewOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  videoBigPlay: { position: 'absolute', top: '50%', left: '50%', marginLeft: responsive(-28), marginTop: responsive(-28), width: responsive(56), height: responsive(56), borderRadius: responsive(28), backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  videoTitle: { color: COLORS.white, fontSize: responsive(16), fontWeight: '700', marginTop: responsive(16) },
  videoMeta: { color: COLORS.gray400, fontSize: responsive(12), marginTop: responsive(4) },
  videoVerifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.green, borderRadius: responsive(10), paddingHorizontal: responsive(10), paddingVertical: responsive(4), marginTop: responsive(10) },
  videoVerifiedText: { color: COLORS.white, fontSize: responsive(11), fontWeight: '700' },
  videoNote: { color: COLORS.gray400, fontSize: responsive(11), marginTop: responsive(16), textAlign: 'center' },
});