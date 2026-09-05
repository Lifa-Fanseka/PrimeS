import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { pickAndUploadImage, pickAndUploadVideo } from '../MediaService/Upload';
import VideoPlayer from '../components/VideoPlayer';
import { Image as ExpoImage } from 'expo-image';

// Cloudinary generates a real video-frame thumbnail automatically
// when you request the video's URL with an image extension instead —
// no separate upload step needed since the video is already stored there.
function getVideoThumbnail(videoUrl) {
  if (!videoUrl) return videoUrl;
  return videoUrl.replace(/\.\w+(\?.*)?$/, '.jpg');
}

// Sizes itself to the photo's real aspect ratio (measured once via
// Image.getSize) instead of forcing a fixed height — this is what
// avoids both cropping AND black letterbox bars, since the container
// always matches the image's actual shape.
const FEED_PHOTO_WIDTH = Dimensions.get('window').width - 32; // matches the card's horizontal padding
const MAX_FEED_PHOTO_HEIGHT = 420;

// Module-level cache, outside the component — persists for the whole
// app session, shared across every FeedPhoto instance regardless of
// mount/unmount. This is what fixes the scroll-up flicker: FlatList
// correctly unmounts photos that scroll far off-screen (that's what
// keeps scrolling smooth), but without this cache, scrolling back to
// one meant a brand-new component instance re-measuring from scratch —
// a visible flash back to the fallback height before settling again.
// Twitter/Instagram/Facebook all do the equivalent of this: compute a
// photo's aspect ratio once, remember it permanently, never re-measure
// something already seen.
const photoHeightCache = new Map();

function FeedPhoto({ uri }) {
  const [height, setHeight] = useState(photoHeightCache.get(uri) ?? 288);

  useEffect(() => {
    if (photoHeightCache.has(uri)) {
      setHeight(photoHeightCache.get(uri));
      return;
    }

    let cancelled = false;
    Image.getSize(
      uri,
      (w, h) => {
        if (cancelled || !w || !h) return;
        const scaledHeight = Math.min(FEED_PHOTO_WIDTH * (h / w), MAX_FEED_PHOTO_HEIGHT);
        photoHeightCache.set(uri, scaledHeight);
        setHeight(scaledHeight);
      },
      () => {} // keep the fallback height if measuring fails
    );
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return (
    <ExpoImage
      source={{ uri }}
      style={[styles.photoPost, { height }]}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={200}
    />
  );
}

export default function AthleteDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Home');
  const [profile, setProfile] = useState(null);
  const [feed, setFeed] = useState([]);
  const [myMedia, setMyMedia] = useState([]);
  const [myStats, setMyStats] = useState([]);
  const [suggestedScouts, setSuggestedScouts] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [hasTeam, setHasTeam] = useState(true); // assume true until checked, avoids a flash of the card
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joiningTeam, setJoiningTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fullscreenPhotoUrl, setFullscreenPhotoUrl] = useState(null);
  const [postModal, setPostModal] = useState(false);
  const [postModalType, setPostModalType] = useState('Photo');
  const [statsModal, setStatsModal] = useState(false);
  const [photoModal, setPhotoModal] = useState(false);
  const [activePostId, setActivePostId] = useState(null);

  // Inline per-post comments — which posts are expanded, what's typed
  // per post, and comments already fetched per post (fetched lazily,
  // once, the first time a post's comment section is opened).
  const [openCommentPostIds, setOpenCommentPostIds] = useState(new Set());
  const [commentInputs, setCommentInputs] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentsLoadingPostId, setCommentsLoadingPostId] = useState(null);
  const commentInputRefs = useRef({});

  const loadAll = useCallback(async () => {
    try {
      const [profileRes, feedRes, myMediaRes, myStatsRes, scoutsRes, notifRes, convosRes] =
        await Promise.all([
          api.get('/api/Athlete/GetProfile'),
          api.get('/api/Media/feed'),
          api.get('/api/Media/me'),
          api.get('/api/Statistics/GetMyStats'),
          api.get('/api/Scout'),
          api.get('/api/Notification/me'),
          api.get('/api/Message/conversations'),
        ]);
      setProfile(profileRes.data);
      setFeed(feedRes.data);
      setMyMedia(myMediaRes.data);
      setMyStats(myStatsRes.data);
      setSuggestedScouts(scoutsRes.data.slice(0, 2));
      setUnreadNotifications(notifRes.data.filter((n) => !n.isRead).length);
      setUnreadMessages(convosRes.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
      // Separate, non-fatal check — a 404 here just means "no team yet," not an error.
      try {
        await api.get('/api/Team/GetAthleteteam');
        setHasTeam(true);
      } catch {
        setHasTeam(false);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      Alert.alert('Error', 'Could not load your dashboard. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const hasPhoto = !!profile?.profilePhoto;
  const hasVideo = myMedia.some((m) => m.fileType === 'Video');
  const hasStats = myStats.length > 0;
  const completedSteps = [hasPhoto, hasVideo, hasStats].filter(Boolean).length;

  const toggleLike = async (post) => {
    setFeed((prev) =>
      prev.map((p) =>
        p.mediaId === post.mediaId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p
      )
    );
    try {
      if (post.likedByMe) {
        await api.delete(`/api/Media/${post.mediaId}/like`);
      } else {
        await api.post(`/api/Media/${post.mediaId}/like`);
      }
    } catch (err) {
      setFeed((prev) =>
        prev.map((p) =>
          p.mediaId === post.mediaId
            ? { ...p, likedByMe: post.likedByMe, likeCount: post.likeCount }
            : p
        )
      );
      Alert.alert('Error', 'Could not update like. Please try again.');
    }
  };

  const toggleCommentSection = async (mediaId) => {
    const next = new Set(openCommentPostIds);
    if (next.has(mediaId)) {
      next.delete(mediaId);
      setOpenCommentPostIds(next);
      return;
    }
    next.add(mediaId);
    setOpenCommentPostIds(next);

    setTimeout(() => commentInputRefs.current[mediaId]?.focus(), 50);

    if (!commentsByPost[mediaId]) {
      setCommentsLoadingPostId(mediaId);
      try {
        const res = await api.get(`/api/Media/${mediaId}/comments`);
        setCommentsByPost((prev) => ({ ...prev, [mediaId]: res.data }));
      } catch (err) {
        Alert.alert('Error', 'Could not load comments.');
      } finally {
        setCommentsLoadingPostId(null);
      }
    }
  };

  const submitComment = async (mediaId) => {
    const text = (commentInputs[mediaId] || '').trim();
    if (!text) return;
    try {
      const res = await api.post(`/api/Media/${mediaId}/comments`, {
        commentText: text,
      });
      setCommentsByPost((prev) => ({
        ...prev,
        [mediaId]: [...(prev[mediaId] || []), res.data],
      }));
      setCommentInputs((prev) => ({ ...prev, [mediaId]: '' }));
      setFeed((prev) =>
        prev.map((p) =>
          p.mediaId === mediaId ? { ...p, commentCount: p.commentCount + 1 } : p
        )
      );
    } catch (err) {
      Alert.alert('Error', 'Could not post comment.');
    }
  };

  const [postUrl, setPostUrl] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);

  const openPostModal = (type) => {
    setPostModalType(type);
    setPostUrl('');
    setPostCaption('');
    setPostModal(true);
  };

  const submitPost = async () => {
    if (!postUrl.trim()) {
      Alert.alert('Missing URL', "Paste a file URL to continue (real upload isn't wired up yet).");
      return;
    }
    setPostSubmitting(true);
    try {
      const res = await api.post('/api/Media', {
        fileType: postModalType,
        fileUrl: postUrl.trim(),
        caption: postCaption.trim() || null,
      });
      if (postModalType === 'Photo') {
        setFeed((prev) => [res.data, ...prev]);
      } else {
        Alert.alert(
          'Submitted for Review',
          'Your video has been sent to your coach for verification before it appears on the feed.'
        );
      }
      setMyMedia((prev) => [res.data, ...prev]);
      setPostModal(false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not create post.');
    } finally {
      setPostSubmitting(false);
    }
  };

  const [availableMatches, setAvailableMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [statsForm, setStatsForm] = useState({
    goals: '',
    assists: '',
    minutesPlayed: '',
    matchRating: '',
  });
  const [statsSubmitting, setStatsSubmitting] = useState(false);

  const openStatsModal = async () => {
    setStatsModal(true);
    setSelectedMatchId(null);
    setStatsForm({ goals: '', assists: '', minutesPlayed: '', matchRating: '' });
    try {
     const res = await api.get('/api/Match/GetAthleteTeamMatches');
      setAvailableMatches(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load your matches.');
    }
  };

  const submitStats = async () => {
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
        matchRating: statsForm.matchRating ? Number(statsForm.matchRating) : null,
      });
      Alert.alert(
        'Stats Submitted',
        'Your statistics will be sent to your coach for verification before appearing on your profile.'
      );
      setStatsModal(false);
      loadAll();
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not submit statistics.');
    } finally {
      setStatsSubmitting(false);
    }
  };

  const [profilePhotoInput, setProfilePhotoInput] = useState('');
  const [photoSubmitting, setPhotoSubmitting] = useState(false);

  const openPhotoModal = () => {
    setProfilePhotoInput(profile?.profilePhoto ?? '');
    setPhotoModal(true);
  };

  const submitProfilePhoto = async () => {
    if (!profilePhotoInput.trim()) {
      Alert.alert('Missing URL', "Paste a photo URL to continue (real upload isn't wired up yet).");
      return;
    }
    setPhotoSubmitting(true);
    try {
      await api.put('/api/Athlete/me/photo', { profilePhoto: profilePhotoInput.trim() });
      setPhotoModal(false);
      loadAll();
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not update profile photo.');
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCodeInput.trim()) {
      Alert.alert('Missing Code', 'Please enter your team invite code.');
      return;
    }
    setJoiningTeam(true);
    try {
      await api.post('/api/Team/JoinTeam', { inviteCode: joinCodeInput.trim() });
      setHasTeam(true);
      setJoinCodeInput('');
      Alert.alert('Success', "You've joined your team!");
      loadAll();
    } catch (err) {
      Alert.alert('Could Not Join', err?.response?.data ?? 'Please check your invite code and try again.');
    } finally {
      setJoiningTeam(false);
    }
  };

  const connectWithScout = (scout) => {
    if (!scout.userId) {
      Alert.alert('Unavailable', 'This scout cannot be messaged right now.');
      return;
    }
    navigation.navigate('Messages', {
      recipientId: scout.userId,
      recipientName: scout.name,
    });
  };

  const iconButton = (icon, onPress, count = 0) => (
    <Pressable style={styles.headerIconButton} onPress={onPress}>
      <Feather name={icon} size={21} color="#111827" />
      {count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </Pressable>
  );

  const AVATAR_COLOR_PALETTE = ['#06B6D4', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#22C55E', '#EF4444'];
  const getAvatarColor = (name) => {
    if (!name) return AVATAR_COLOR_PALETTE[0];
    const sum = name
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLOR_PALETTE[sum % AVATAR_COLOR_PALETTE.length];
  };
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  };

  const avatarGradient = (size = 48, photoUrl = null, name = null) => {
    if (photoUrl) {
      return (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      );
    }
    const initials = getInitials(name);
    if (initials) {
      return (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: getAvatarColor(name),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: size / 2.5 }}>
            {initials}
          </Text>
        </View>
      );
    }
    return (
      <LinearGradient
        colors={['#06B6D4', '#3B82F6']}
        style={[
          styles.gradientAvatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Feather name="user" size={size / 2.3} color="#FFFFFF" />
      </LinearGradient>
    );
  };

  const ActionButton = ({ icon, label, color = '#6B7280', onPress }) => (
    <Pressable style={styles.actionButton} onPress={onPress}>
      <Feather name={icon} size={18} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderFeedPost = ({ item: post }) => (
    <View style={styles.card}>
      <Author
        avatarColor="#06B6D4"
        photoUrl={post.athleteProfilePhoto}
        name={post.athleteName ?? 'Unknown Athlete'}
        subtitle={`${post.sport ?? ''}${post.position ? ' • ' + post.position : ''} • ${formatTimeAgo(post.uploadDate)}`}
        onPress={() => {
          if (post.athleteId === profile?.athleteId) {
            navigation.navigate('Profile');
          } else if (post.athleteId) {
            navigation.navigate('PublicProfile', { type: 'Athlete', id: post.athleteId });
          }
        }}
      />
      {post.caption ? <Text style={styles.postText}>{post.caption}</Text> : null}
      {post.fileType === 'Video' ? (
        <VideoCard image={post.fileUrl} verified={post.verified} />
      ) : (
        <Pressable onPress={() => setFullscreenPhotoUrl(post.fileUrl)}>
          <FeedPhoto uri={post.fileUrl} />
        </Pressable>
      )}
      <View style={styles.actionRow}>
        <ActionButton
          icon="heart"
          label={`${post.likeCount}`}
          color={post.likedByMe ? '#EF4444' : '#6B7280'}
          onPress={() => toggleLike(post)}
        />
        <ActionButton
          icon="message-circle"
          label={post.commentCount > 0 ? `${post.commentCount}` : 'Comment'}
          color={openCommentPostIds.has(post.mediaId) ? '#06B6D4' : '#6B7280'}
          onPress={() => toggleCommentSection(post.mediaId)}
        />
      </View>
      {openCommentPostIds.has(post.mediaId) && (
        <InlineCommentSection
          mediaId={post.mediaId}
          comments={commentsByPost[post.mediaId] || []}
          loading={commentsLoadingPostId === post.mediaId}
          inputValue={commentInputs[post.mediaId] || ''}
          onChangeInput={(text) => setCommentInputs((prev) => ({ ...prev, [post.mediaId]: text }))}
          onSubmit={() => submitComment(post.mediaId)}
          inputRef={(el) => { commentInputRefs.current[post.mediaId] = el; }}
        />
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, styles.centerLoading]}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerLogo}>PRIME SCOUT</Text>
        <View style={styles.headerActions}>
          {iconButton('search', () => navigation.navigate('Search'))}
          {iconButton('message-circle', () => navigation.navigate('Messages'), unreadMessages)}
          {iconButton('settings', () => navigation.navigate('Settings'))}
        </View>
      </View>
      <FlatList
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        data={feed}
        keyExtractor={(post) => String(post.mediaId)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={renderFeedPost}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={12}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={
          <>
            {completedSteps < 3 && (
              <View style={styles.card}>
                <View style={styles.profileTop}>
                  {avatarGradient(64, profile?.profilePhoto, profile?.name)}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Complete your profile</Text>
                    <Text style={styles.smallGray}>{completedSteps} of 3 steps completed</Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${(completedSteps / 3) * 100}%` }]} />
                </View>
                <Pressable style={styles.checkRow} onPress={openPhotoModal}>
                  <Feather
                    name={hasPhoto ? 'check-circle' : 'circle'}
                    size={20}
                    color={hasPhoto ? '#22C55E' : '#9CA3AF'}
                  />
                  <Text style={styles.checkText}>Add profile photo</Text>
                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>
                <Pressable style={styles.checkRow} onPress={() => openPostModal('Video')}>
                  <Feather
                    name={hasVideo ? 'check-circle' : 'circle'}
                    size={20}
                    color={hasVideo ? '#22C55E' : '#9CA3AF'}
                  />
                  <Text style={styles.checkText}>Upload highlight video</Text>
                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>
                <Pressable style={styles.checkRow} onPress={openStatsModal}>
                  <Feather
                    name={hasStats ? 'check-circle' : 'circle'}
                    size={20}
                    color={hasStats ? '#22C55E' : '#9CA3AF'}
                  />
                  <Text style={styles.checkText}>Add performance stats</Text>
                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>
              </View>
            )}
            <View style={styles.card}>
              <View style={styles.createTop}>
                {avatarGradient(40, profile?.profilePhoto, profile?.name)}
                <Pressable style={styles.postInput} onPress={() => openPostModal('Photo')}>
                  <Text style={styles.placeholder}>Share an update...</Text>
                </Pressable>
              </View>
              <View style={styles.createDivider} />
              <View style={styles.createActions}>
                <Pressable style={styles.createAction} onPress={() => openPostModal('Photo')}>
                  <Feather name="camera" size={18} color="#06B6D4" />
                  <Text style={styles.createActionText}>Photo</Text>
                </Pressable>
                <Pressable style={styles.createAction} onPress={() => openPostModal('Video')}>
                  <Feather name="video" size={18} color="#06B6D4" />
                  <Text style={styles.createActionText}>Video</Text>
                </Pressable>
                <Pressable style={styles.createAction} onPress={openStatsModal}>
                  <Feather name="award" size={18} color="#06B6D4" />
                  <Text style={styles.createActionText}>Stats</Text>
                </Pressable>
              </View>
              <View style={styles.createDivider} />
              <Pressable
                style={styles.teamButton}
                onPress={() => navigation.navigate(hasTeam ? 'MyTeam' : 'JoinTeam')}
              >
                <Feather name="shield" size={20} color="#06B6D4" />
                <Text style={styles.teamButtonText}>{hasTeam ? 'My Team' : 'Team'}</Text>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.card}>
            <Text style={styles.smallGray}>No posts yet. Be the first to share something!</Text>
          </View>
        }
        ListFooterComponent={
          suggestedScouts.length > 0 ? (
            <View style={styles.card}>
              <View style={styles.suggestedHeader}>
                <Feather name="users" size={20} color="#06B6D4" />
                <Text style={styles.cardTitle}>Suggested Scouts</Text>
              </View>
              {suggestedScouts.map((scout) => (
                <ScoutSuggestion
                  key={scout.scoutId}
                  name={scout.name}
                  organization={scout.organization}
                  photoUrl={scout.profilePhoto}
                  onPress={() => connectWithScout(scout)}
                />
              ))}
            </View>
          ) : null
        }
      />
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
        {[
          ['Home', 'home'],
          ['Network', 'users'],
          ['Messages', 'message-circle'],
          ['Notifications', 'bell'],
          ['Me', 'user'],
        ].map(([tab, icon]) => (
          <Pressable
            key={tab}
            style={styles.navItem}
            onPress={() => {
              setActiveTab(tab);
              if (tab === 'Home') return;
              if (tab === 'Network') navigation.navigate('Network');
              if (tab === 'Messages') navigation.navigate('Messages');
              if (tab === 'Notifications') navigation.navigate('Notifications');
              if (tab === 'Me') navigation.navigate('Profile');
            }}
          >
            <View>
              <Feather
                name={icon}
                size={24}
                color={activeTab === tab ? '#06B6D4' : '#6B7280'}
              />
              {tab === 'Notifications' && unreadNotifications > 0 && (
                <View style={styles.navCountBadge}>
                  <Text style={styles.navCountBadgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
              {tab === 'Messages' && unreadMessages > 0 && (
                <View style={styles.navCountBadge}>
                  <Text style={styles.navCountBadgeText}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.navLabel, activeTab === tab && { color: '#06B6D4' }]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
      <PostModal
        visible={postModal}
        type={postModalType}
        onClose={() => setPostModal(false)}
        url={postUrl}
        setUrl={setPostUrl}
        caption={postCaption}
        setCaption={setPostCaption}
        submitting={postSubmitting}
        onSubmit={submitPost}
        bottomInset={insets.bottom}
      />
      <StatsModal
        visible={statsModal}
        onClose={() => setStatsModal(false)}
        matches={availableMatches}
        selectedMatchId={selectedMatchId}
        setSelectedMatchId={setSelectedMatchId}
        form={statsForm}
        setForm={setStatsForm}
        submitting={statsSubmitting}
        onSubmit={submitStats}
        bottomInset={insets.bottom}
      />
      <Modal visible={!!fullscreenPhotoUrl} animationType="fade" onRequestClose={() => setFullscreenPhotoUrl(null)}>
        <View style={styles.videoPlaybackScreen}>
          <Pressable style={styles.videoPlaybackClose} onPress={() => setFullscreenPhotoUrl(null)}>
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
          {fullscreenPhotoUrl && (
            <Image
              source={{ uri: fullscreenPhotoUrl }}
              style={styles.fullscreenPhoto}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      <PhotoModal
        visible={photoModal}
        onClose={() => setPhotoModal(false)}
        url={profilePhotoInput}
        setUrl={setProfilePhotoInput}
        submitting={photoSubmitting}
        onSubmit={submitProfilePhoto}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

function Author({ avatarColor, photoUrl, name, subtitle, onPress }) {
  return (
    <Pressable style={styles.authorRow} onPress={onPress}>
      {photoUrl ? (
        <ExpoImage
          source={{ uri: photoUrl }}
          style={styles.solidAvatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      ) : (
        <View style={[styles.solidAvatar, { backgroundColor: avatarColor }]} />
      )}
      <View>
        <Text style={styles.authorName}>{name}</Text>
        <Text style={styles.authorSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function VideoCard({ image, verified }) {
  const [activated, setActivated] = useState(false);
  if (activated) {
    return (
      <View style={styles.videoCard}>
        <VideoPlayer uri={image} style={styles.videoImage} />
      </View>
    );
  }
  return (
    <Pressable style={styles.videoCard} onPress={() => setActivated(true)}>
      <ExpoImage
        source={{ uri: getVideoThumbnail(image) }}
        style={styles.videoImage}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={200}
      />
      <View style={styles.videoOverlay} />
      {verified ? (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>VERIFIED</Text>
        </View>
      ) : (
        <View style={[styles.verifiedBadge, { backgroundColor: '#F59E0B' }]}>
          <Text style={styles.verifiedText}>PENDING REVIEW</Text>
        </View>
      )}
      <View style={styles.playButton}>
        <Feather name="play" size={28} color="#06B6D4" />
      </View>
    </Pressable>
  );
}

function ScoutSuggestion({ name, organization, photoUrl, onPress }) {
  return (
    <View style={styles.scoutSuggestion}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.scoutAvatar} />
      ) : (
        <LinearGradient colors={['#3B82F6', '#06B6D4']} style={styles.scoutAvatar} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.authorName}>{name}</Text>
        <Text style={styles.authorSubtitle}>{organization ?? 'Scout'}</Text>
      </View>
      <Pressable style={styles.connectButton} onPress={onPress}>
        <Text style={styles.connectText}>Message</Text>
      </Pressable>
    </View>
  );
}

function ModalKeyboardWrapper({ children, bottomInset = 0 }) {
  return (
    <KeyboardAvoidingView
      style={styles.modalOverlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.bottomSheet, { paddingBottom: 20 + bottomInset }]}>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}

function InlineCommentSection({ mediaId, comments, loading, inputValue, onChangeInput, onSubmit, inputRef }) {
  const AVATAR_PALETTE = ['#06B6D4', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#22C55E', '#EF4444'];
  const getAvatarColor = (name) => {
    if (!name) return AVATAR_PALETTE[0];
    const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
  };
  const getInitials = (name) => {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
  };

  return (
    <View style={styles.inlineCommentsWrap}>
      {loading ? (
        <ActivityIndicator color="#06B6D4" style={{ marginVertical: 12 }} />
      ) : (
        comments.length > 0 && (
          <View style={styles.inlineCommentsList}>
            {comments.map((c) => (
              <View key={c.mediaCommentId} style={styles.inlineCommentRow}>
                {c.athleteProfilePhoto ? (
                  <Image source={{ uri: c.athleteProfilePhoto }} style={styles.inlineCommentAvatar} />
                ) : (
                  <View style={[styles.inlineCommentAvatar, { backgroundColor: getAvatarColor(c.athleteName) }]}>
                    <Text style={styles.inlineCommentAvatarText}>{getInitials(c.athleteName)}</Text>
                  </View>
                )}
                <View style={styles.inlineCommentBubble}>
                  <Text style={styles.inlineCommentAuthor}>{c.athleteName ?? 'Athlete'}</Text>
                  <Text style={styles.inlineCommentText}>{c.commentText}</Text>
                </View>
              </View>
            ))}
          </View>
        )
      )}
      <View style={styles.inlineCommentInputRow}>
        <TextInput
          ref={inputRef}
          style={styles.inlineCommentInput}
          placeholder="Write a comment..."
          placeholderTextColor="#9CA3AF"
          value={inputValue}
          onChangeText={onChangeInput}
          onSubmitEditing={onSubmit}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.inlineSendButton, !inputValue.trim() && styles.inlineSendButtonDisabled]}
          onPress={onSubmit}
          disabled={!inputValue.trim()}
        >
          <Feather name="send" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function PostModal({ visible, type, onClose, url, setUrl, caption, setCaption, submitting, onSubmit, bottomInset }) {
  const [picking, setPicking] = useState(false);
  const [progress, setProgress] = useState(0);
  const handleChooseFile = async () => {
    try {
      setPicking(true);
      setProgress(0);
      const secureUrl = type === 'Video'
        ? await pickAndUploadVideo(setProgress)
        : await pickAndUploadImage(setProgress);
      if (secureUrl) setUrl(secureUrl);
    } catch (err) {
      Alert.alert('Upload Failed', err?.message || `Could not upload ${type.toLowerCase()}.`);
    } finally {
      setPicking(false);
    }
  };
  return (
    <Modal visible={visible} transparent animationType="slide">
      <ModalKeyboardWrapper bottomInset={bottomInset}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <ModalHeader title={`Create ${type} Post`} onClose={onClose} />
          {type === 'Photo' && url ? (
            <Image source={{ uri: url }} style={styles.photoPreview} />
          ) : null}
          <Pressable style={styles.chooseButton} onPress={handleChooseFile} disabled={picking}>
            {picking ? (
              <Text style={styles.chooseButtonText}>Uploading... {progress}%</Text>
            ) : (
              <Text style={styles.chooseButtonText}>
                {url ? `${type} Selected — Choose Different` : `Choose ${type}`}
              </Text>
            )}
          </Pressable>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            multiline
            value={caption}
            onChangeText={setCaption}
          />
          <Pressable
            style={[styles.scoutButton, (submitting || !url) && { opacity: 0.5 }]}
            onPress={onSubmit}
            disabled={submitting || !url}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.scoutButtonText}>Post</Text>
            )}
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </ModalKeyboardWrapper>
    </Modal>
  );
}

function PhotoModal({ visible, onClose, url, setUrl, submitting, onSubmit, bottomInset }) {
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
    <Modal visible={visible} transparent animationType="slide">
      <ModalKeyboardWrapper bottomInset={bottomInset}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <ModalHeader title="Add Profile Photo" onClose={onClose} />
          {url ? <Image source={{ uri: url }} style={styles.photoPreview} /> : null}
          <Pressable style={styles.chooseButton} onPress={handleChoosePhoto} disabled={picking}>
            {picking ? (
              <Text style={styles.chooseButtonText}>Uploading... {progress}%</Text>
            ) : (
              <Text style={styles.chooseButtonText}>{url ? 'Choose Different Photo' : 'Choose Photo'}</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.scoutButton, (submitting || !url) && { opacity: 0.5 }]}
            onPress={onSubmit}
            disabled={submitting || !url}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.scoutButtonText}>Save Photo</Text>
            )}
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </ModalKeyboardWrapper>
    </Modal>
  );
}

function StatsModal({ visible, onClose, matches, selectedMatchId, setSelectedMatchId, form, setForm, submitting, onSubmit, bottomInset }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <ModalKeyboardWrapper bottomInset={bottomInset}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <ModalHeader title="Upload Match Statistics" onClose={onClose} />
          <Text style={styles.label}>Select Match</Text>
          {matches.length === 0 ? (
            <Text style={styles.smallGray}>
              No matches available. Ask your coach to add one, or join a team first.
            </Text>
          ) : (
            matches.map((m) => (
              <Pressable
                key={m.matchId}
                style={[
                  styles.matchOption,
                  selectedMatchId === m.matchId && styles.matchOptionSelected,
                ]}
                onPress={() => setSelectedMatchId(m.matchId)}
              >
                <Text style={styles.authorName}>
                  vs {m.opponentTeam ?? 'Unknown'} ({m.matchType ?? '—'})
                </Text>
                <Text style={styles.authorSubtitle}>{m.matchDate}</Text>
              </Pressable>
            ))
          )}
          <TextInput
            style={styles.modalInput}
            placeholder="Goals"
            keyboardType="numeric"
            value={form.goals}
            onChangeText={(v) => setForm({ ...form, goals: v })}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Assists"
            keyboardType="numeric"
            value={form.assists}
            onChangeText={(v) => setForm({ ...form, assists: v })}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Minutes Played"
            keyboardType="numeric"
            value={form.minutesPlayed}
            onChangeText={(v) => setForm({ ...form, minutesPlayed: v })}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Match Rating (0-10)"
            keyboardType="numeric"
            value={form.matchRating}
            onChangeText={(v) => setForm({ ...form, matchRating: v })}
          />
          <Text style={[styles.smallGray, { marginBottom: 12 }]}>
            Your statistics will be sent to your coach for verification before appearing on your profile.
          </Text>
          <Pressable style={styles.scoutButton} onPress={onSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.scoutButtonText}>Submit Statistics</Text>
            )}
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </ModalKeyboardWrapper>
    </Modal>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>{title}</Text>
      <Pressable onPress={onClose}>
        <Feather name="x" size={24} color="#111827" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  centerLoading: { alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLogo: { fontSize: 20, fontWeight: '800', color: '#000000' },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  countBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  feed: { flex: 1 },
  feedContent: { paddingBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 16,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  gradientAvatar: { alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#000000' },
  smallGray: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  joinTeamHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  joinTeamRow: { flexDirection: 'row', gap: 8 },
  joinTeamInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    letterSpacing: 1,
  },
  joinTeamButton: {
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinTeamButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 99,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },
  progressFill: { height: 8, borderRadius: 99, backgroundColor: '#06B6D4' },
  checkRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkText: { flex: 1, fontSize: 14, color: '#1F2937' },
  createTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  postInput: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  placeholder: { color: '#9CA3AF', fontSize: 14 },
  createDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: 12,
    marginBottom: 12,
  },
  createActions: { flexDirection: 'row', justifyContent: 'space-around' },
  teamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  teamButtonText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  createAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createActionText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  solidAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: { fontSize: 14, fontWeight: '700', color: '#000000' },
  authorSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  postText: { fontSize: 14, color: '#1F2937', lineHeight: 21, marginBottom: 8 },
  videoCard: {
    height: 256,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 12,
  },
  videoImage: { width: '100%', height: '100%', backgroundColor: '#000000' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -32,
    marginTop: -32,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#22C55E',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  verifiedText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: { fontSize: 13, fontWeight: '600' },
  photoPost: { width: '100%', borderRadius: 16, marginTop: 8, marginBottom: 12 },
  suggestedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  scoutSuggestion: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  scoutAvatar: { width: 48, height: 48, borderRadius: 24 },
  connectButton: {
    borderWidth: 2,
    borderColor: '#06B6D4',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  connectText: { color: '#06B6D4', fontWeight: '700', fontSize: 13 },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    elevation: 8,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 11, fontWeight: '500', color: '#6B7280', marginTop: 3 },
  navDot: {
    position: 'absolute',
    top: -1,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  navCountBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  navCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  bottomSheet: {
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  centerModal: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignSelf: 'center',
    width: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  inlineCommentsWrap: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: -4,
    marginBottom: 4,
  },
  inlineCommentsList: { gap: 10, marginBottom: 10 },
  inlineCommentRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  inlineCommentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inlineCommentAvatarText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  inlineCommentBubble: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    borderTopLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineCommentAuthor: { fontSize: 12, fontWeight: '700', color: '#000000', marginBottom: 2 },
  inlineCommentText: { fontSize: 13, color: '#374151', lineHeight: 18 },
  inlineCommentInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inlineCommentInput: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#000000',
  },
  inlineSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineSendButtonDisabled: { backgroundColor: '#D1D5DB' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  matchOption: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  matchOptionSelected: { borderColor: '#06B6D4', backgroundColor: '#ECFEFF' },
  captionInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
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
  fullscreenPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    marginBottom: 14,
  },
  chooseButton: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#06B6D4',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  chooseButtonText: { color: '#06B6D4', fontSize: 14, fontWeight: '700' },
  cancelText: { textAlign: 'center', marginTop: 12, color: '#4B5563', fontWeight: '600' },
  scoutButton: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoutButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});