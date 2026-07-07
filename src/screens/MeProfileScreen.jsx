import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Dimensions,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HIGHLIGHT_HEIGHT = (SCREEN_WIDTH - 40) * 0.5625;

const COLORS = {
  cyan: '#06B6D4',
  cyanDark: '#0891B2',
  cyanLight: '#ECFEFF',
  blue: '#3B82F6',
  blueDark: '#2563EB',
  blueLight: '#EFF6FF',
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
  greenLight: '#F0FDF4',
  yellow: '#FACC15',
  purple: '#A855F7',
  purpleLight: '#F3E8FF',
  red: '#EF4444',
  overlayDark: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
};

const ATHLETE = {
  name: 'Themba Nkosi',
  age: 19,
  sport: 'Football',
  position: 'Midfielder',
  location: 'Johannesburg, South Africa',
  team: 'Soweto United FC',
  joinDate: 'January 2024',
  rating: 8.5,
  goals: 18,
  assists: 12,
  matches: 24,
  profileViews: 342,
  scoutSaves: 14,
  verified: true,
  completionPercent: 60,
  coverImage:
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1080',
  profileImage:
    'https://images.unsplash.com/photo-1578479161055-9d2d985e2de0?w=400',
  about:
    'Passionate midfielder dedicated to excellence. I train hard, play harder, and always strive to be better than yesterday. Looking to connect with scouts and expand my network in South African football.',
};

const INITIAL_STATS = [
  {
    id: '1',
    opponent: 'Cape Town United',
    date: 'May 15, 2026',
    goals: 2,
    assists: 1,
    minutesPlayed: 90,
    rating: 8.5,
    matchType: 'League',
  },
  {
    id: '2',
    opponent: 'Johannesburg FC',
    date: 'May 10, 2026',
    goals: 1,
    assists: 2,
    minutesPlayed: 85,
    rating: 8.2,
    matchType: 'Cup',
  },
  {
    id: '3',
    opponent: 'Durban United',
    date: 'May 5, 2026',
    goals: 0,
    assists: 1,
    minutesPlayed: 78,
    rating: 7.8,
    matchType: 'League',
  },
];

const INITIAL_HIGHLIGHTS = [
  {
    id: '1',
    title: 'Amazing Goal vs Cape Town',
    date: 'May 15, 2026',
    duration: '0:45',
    views: 1240,
    verified: true,
    thumbnail:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
  },
  {
    id: '2',
    title: 'Hat-trick Performance',
    date: 'May 10, 2026',
    duration: '2:30',
    views: 2580,
    verified: true,
    thumbnail:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600',
  },
  {
    id: '3',
    title: 'Assist Compilation',
    date: 'May 5, 2026',
    duration: '1:15',
    views: 890,
    verified: false,
    thumbnail:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600',
  },
];

const ACHIEVEMENTS = [
  {
    id: '1',
    icon: 'trophy',
    iconLib: 'MaterialCommunityIcons',
    color: COLORS.yellow,
    bg: '#FEF9C3',
    title: 'Top Scorer',
    subtitle: 'Regional League 2025',
    date: 'Dec 2025',
  },
  {
    id: '2',
    icon: 'star',
    iconLib: 'Feather',
    color: COLORS.cyan,
    bg: COLORS.cyanLight,
    title: 'Player of the Month',
    subtitle: 'April 2026',
    date: 'Apr 2026',
  },
  {
    id: '3',
    icon: 'shield',
    iconLib: 'Feather',
    color: COLORS.purple,
    bg: COLORS.purpleLight,
    title: 'Most Assists',
    subtitle: 'Cup Tournament 2026',
    date: 'Mar 2026',
  },
];

const COMPLETION_CHECKLIST = [
  { id: '1', label: 'Add profile photo', done: true, action: 'photo' },
  { id: '2', label: 'Upload highlight video', done: false, action: 'highlight' },
  { id: '3', label: 'Add performance stats', done: false, action: 'stats' },
  { id: '4', label: 'Write bio / about section', done: true, action: 'edit' },
  { id: '5', label: 'Add team information', done: true, action: 'edit' },
];

export default function MeProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(ATHLETE);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeBottomTab, setActiveBottomTab] = useState('me');
  const [playerStats, setPlayerStats] = useState(INITIAL_STATS);
  const [highlights, setHighlights] = useState(INITIAL_HIGHLIGHTS);
  const [selectedHighlight, setSelectedHighlight] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const [editForm, setEditForm] = useState({
    name: ATHLETE.name,
    sport: ATHLETE.sport,
    position: ATHLETE.position,
    location: ATHLETE.location,
    team: ATHLETE.team,
    about: ATHLETE.about,
  });

  const [uploadForm, setUploadForm] = useState({
    title: '',
    duration: '',
  });

  const [statsForm, setStatsForm] = useState({
    opponent: '',
    date: '',
    goals: '',
    assists: '',
    minutesPlayed: '',
    rating: '',
    matchType: 'League',
  });

  const updateEditForm = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const updateUploadForm = (field, value) => {
    setUploadForm({ ...uploadForm, [field]: value });
  };

  const updateStatsForm = (field, value) => {
    setStatsForm({ ...statsForm, [field]: value });
  };

  const handleChecklistPress = (item) => {
    if (item.action === 'highlight') setShowUploadModal(true);
    if (item.action === 'stats') setShowStatsModal(true);
    if (item.action === 'edit') setShowEditModal(true);
    if (item.action === 'photo') {
      Alert.alert('Photo', 'Profile photo upload coming soon.');
    }
  };

  const handleSaveProfile = () => {
    setProfile({
      ...profile,
      name: editForm.name,
      sport: editForm.sport,
      position: editForm.position,
      location: editForm.location,
      team: editForm.team,
      about: editForm.about,
    });

    Alert.alert('Saved', 'Profile updated!');
    setShowEditModal(false);
  };

  const handleUploadHighlight = () => {
    if (!uploadForm.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a video title.');
      return;
    }

    const newHighlight = {
      id: Date.now().toString(),
      title: uploadForm.title,
      date: 'Today',
      duration: uploadForm.duration || '0:30',
      views: 0,
      verified: false,
      thumbnail:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
    };

    setHighlights([newHighlight, ...highlights]);
    setUploadForm({ title: '', duration: '' });
    setShowUploadModal(false);
    Alert.alert('Uploaded!', 'Your highlight has been added.');
  };

  const handleSaveStats = () => {
    if (!statsForm.opponent.trim() || !statsForm.date.trim()) {
      Alert.alert('Missing Details', 'Please enter opponent and match date.');
      return;
    }

    const newStat = {
      id: Date.now().toString(),
      opponent: statsForm.opponent,
      date: statsForm.date,
      goals: Number(statsForm.goals) || 0,
      assists: Number(statsForm.assists) || 0,
      minutesPlayed: Number(statsForm.minutesPlayed) || 0,
      rating: Number(statsForm.rating) || 0,
      matchType: statsForm.matchType || 'League',
    };

    setPlayerStats([newStat, ...playerStats]);
    setStatsForm({
      opponent: '',
      date: '',
      goals: '',
      assists: '',
      minutesPlayed: '',
      rating: '',
      matchType: 'League',
    });
    setShowStatsModal(false);
    Alert.alert('Stats Added!', 'Your match stats have been recorded.');
  };

  const handleBottomNav = (tabId, screenName) => {
    setActiveBottomTab(tabId);

    if (tabId === 'me') return;

    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.floatingHeader}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.floatingButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color={COLORS.gray700} />
          </TouchableOpacity>

          <View style={styles.floatingRight}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.floatingButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Feather name="settings" size={20} color={COLORS.gray700} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.floatingButton}
              onPress={() =>
                Alert.alert('Share', 'Profile link copied to clipboard!')
              }
            >
              <Feather name="share-2" size={20} color={COLORS.gray700} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.coverContainer}>
            <Image source={{ uri: profile.coverImage }} style={styles.coverImage} />

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.coverOverlay}
            />

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.coverCamera}
              onPress={() =>
                Alert.alert('Upload Cover', 'Cover photo upload coming soon.')
              }
            >
              <Feather name="camera" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={[COLORS.cyan, COLORS.blue]}
                style={styles.avatarGradient}
              >
                <Image
                  source={{ uri: profile.profileImage }}
                  style={styles.profileImage}
                />
              </LinearGradient>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.avatarCamera}
                onPress={() =>
                  Alert.alert('Upload Photo', 'Profile photo upload coming soon.')
                }
              >
                <Feather name="camera" size={12} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{profile.name}</Text>

              {profile.verified && (
                <View style={styles.verifiedCircle}>
                  <Feather name="check" size={12} color={COLORS.white} />
                </View>
              )}
            </View>

            <Text style={styles.sportLine}>
              {profile.sport} • {profile.position}
            </Text>

            <View style={styles.infoLine}>
              <Feather name="map-pin" size={14} color={COLORS.gray500} />
              <Text style={styles.infoLineText}>{profile.location}</Text>
            </View>

            <View style={styles.infoLine}>
              <Feather name="calendar" size={14} color={COLORS.gray500} />
              <Text style={styles.infoLineText}>Joined {profile.joinDate}</Text>
            </View>

            <View style={styles.engagementRow}>
              <InlineStat
                icon="eye"
                value={profile.profileViews}
                label="Profile Views"
              />
              <InlineStat
                icon="bookmark"
                value={profile.scoutSaves}
                label="Scout Saves"
              />
            </View>

            <View style={styles.performanceGrid}>
              <PerformanceCell value={profile.goals} label="Goals" />
              <PerformanceCell value={profile.assists} label="Assists" />
              <PerformanceCell value={profile.matches} label="Matches" />
              <PerformanceCell value={profile.rating} label="Rating" />
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.editButton}
                onPress={() => setShowEditModal(true)}
              >
                <Feather name="edit-2" size={18} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.statsButton}
                onPress={() => setShowStatsModal(true)}
              >
                <Feather name="upload" size={18} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Upload Stats</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.completionCard}>
            <View style={styles.completionTitleRow}>
              <Feather name="check-circle" size={18} color={COLORS.cyan} />
              <Text style={styles.completionTitle}>Complete your profile</Text>
              <Text style={styles.completionPercent}>
                {profile.completionPercent}%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${profile.completionPercent}%` },
                ]}
              />
            </View>

            {COMPLETION_CHECKLIST.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                style={styles.checklistItem}
                onPress={() => handleChecklistPress(item)}
              >
                {item.done ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={COLORS.green}
                  />
                ) : (
                  <View style={styles.emptyCircle} />
                )}

                <Text style={styles.checklistText}>{item.label}</Text>

                {!item.done && (
                  <Feather
                    name="chevron-right"
                    size={14}
                    color={COLORS.gray400}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabsContainer}>
            <ProfileTab
              label="Overview"
              active={activeTab === 'overview'}
              onPress={() => setActiveTab('overview')}
            />
            <ProfileTab
              label="Stats"
              active={activeTab === 'stats'}
              onPress={() => setActiveTab('stats')}
            />
            <ProfileTab
              label="Highlights"
              active={activeTab === 'highlights'}
              onPress={() => setActiveTab('highlights')}
            />
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'overview' && (
              <OverviewContent
                profile={profile}
                playerStats={playerStats}
                onAddStats={() => setShowStatsModal(true)}
              />
            )}

            {activeTab === 'stats' && (
              <StatsContent
                playerStats={playerStats}
                onAddStats={() => setShowStatsModal(true)}
              />
            )}

            {activeTab === 'highlights' && (
              <HighlightsContent
                highlights={highlights}
                onUpload={() => setShowUploadModal(true)}
                onOpenHighlight={(highlight) => {
                  setSelectedHighlight(highlight);
                  setShowVideoModal(true);
                }}
              />
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <BottomTab
            icon="home"
            label="Home"
            active={activeBottomTab === 'home'}
            badge={false}
            onPress={() => handleBottomNav('home', 'AthleteDashboard')}
          />
          <BottomTab
            icon="users"
            label="Network"
            active={activeBottomTab === 'network'}
            badge={false}
            onPress={() => handleBottomNav('network', 'Network')}
          />
          <BottomTab
            icon="message-circle"
            label="Messages"
            active={activeBottomTab === 'messages'}
            badge
            onPress={() => handleBottomNav('messages', 'Messages')}
          />
          <BottomTab
            icon="bell"
            label="Notifications"
            active={activeBottomTab === 'notifications'}
            badge
            onPress={() => handleBottomNav('notifications', 'Notifications')}
          />
          <BottomTab
            icon="user"
            label="Me"
            active={activeBottomTab === 'me'}
            badge={false}
            onPress={() => handleBottomNav('me', 'MeProfile')}
          />
        </View>

        <EditProfileModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          editForm={editForm}
          updateEditForm={updateEditForm}
          onSave={handleSaveProfile}
        />

        <UploadHighlightModal
          visible={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          uploadForm={uploadForm}
          updateUploadForm={updateUploadForm}
          onUpload={handleUploadHighlight}
        />

        <AddStatsModal
          visible={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          statsForm={statsForm}
          updateStatsForm={updateStatsForm}
          onSave={handleSaveStats}
        />

        <VideoPreviewModal
          visible={showVideoModal}
          highlight={selectedHighlight}
          onClose={() => {
            setShowVideoModal(false);
            setSelectedHighlight(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function InlineStat({ icon, value, label }) {
  return (
    <View style={styles.inlineStat}>
      <Feather name={icon} size={13} color={COLORS.cyan} />
      <Text style={styles.inlineValue}>{value}</Text>
      <Text style={styles.inlineLabel}>{label}</Text>
    </View>
  );
}

function PerformanceCell({ value, label }) {
  return (
    <View style={styles.performanceCell}>
      <Text style={styles.performanceValue}>{value}</Text>
      <Text style={styles.performanceLabel}>{label}</Text>
    </View>
  );
}

function ProfileTab({ label, active, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.profileTab} onPress={onPress}>
      <Text style={[styles.profileTabText, active && styles.profileTabTextActive]}>
        {label}
      </Text>
      {active && <View style={styles.activeTabLine} />}
    </TouchableOpacity>
  );
}

function OverviewContent({ profile, playerStats, onAddStats }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.aboutText}>{profile.about}</Text>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Performance</Text>

        <TouchableOpacity activeOpacity={0.75} style={styles.smallAction} onPress={onAddStats}>
          <Feather name="plus" size={13} color={COLORS.cyan} />
          <Text style={styles.smallActionText}>Add Stats</Text>
        </TouchableOpacity>
      </View>

      {playerStats.slice(0, 3).map((stat) => (
        <RecentPerformanceCard key={stat.id} stat={stat} />
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Achievements</Text>

      {ACHIEVEMENTS.map((achievement) => (
        <AchievementCard key={achievement.id} achievement={achievement} />
      ))}
    </View>
  );
}

function RecentPerformanceCard({ stat }) {
  return (
    <LinearGradient
      colors={[COLORS.gray50, COLORS.gray100]}
      style={styles.recentCard}
    >
      <View style={styles.recentTopRow}>
        <Text style={styles.recentOpponent}>{stat.opponent}</Text>
        <View style={styles.matchTypeBadge}>
          <Text style={styles.matchTypeText}>{stat.matchType}</Text>
        </View>
      </View>

      <Text style={styles.statDate}>{stat.date}</Text>

      <View style={styles.recentStatsRow}>
        <MiniStat value={stat.goals} label="Goals" />
        <MiniStat value={stat.assists} label="Assists" />
        <MiniStat value={stat.minutesPlayed} label="Minutes" />
        <MiniStat value={stat.rating} label="Rating" />
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

function AchievementCard({ achievement }) {
  const IconComponent =
    achievement.iconLib === 'MaterialCommunityIcons'
      ? MaterialCommunityIcons
      : Feather;

  return (
    <View style={styles.achievementCard}>
      <View style={[styles.achievementIconCircle, { backgroundColor: achievement.bg }]}>
        <IconComponent name={achievement.icon} size={20} color={achievement.color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.achievementTitle}>{achievement.title}</Text>
        <Text style={styles.achievementSubtitle}>{achievement.subtitle}</Text>
        <Text style={styles.achievementDate}>{achievement.date}</Text>
      </View>
    </View>
  );
}

function StatsContent({ playerStats, onAddStats }) {
  return (
    <View>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Match Statistics</Text>

        <TouchableOpacity activeOpacity={0.75} style={styles.smallAction} onPress={onAddStats}>
          <Feather name="plus" size={13} color={COLORS.cyan} />
          <Text style={styles.smallActionText}>Add Stats</Text>
        </TouchableOpacity>
      </View>

      {playerStats.map((stat) => (
        <FullStatsCard key={stat.id} stat={stat} />
      ))}
    </View>
  );
}

function FullStatsCard({ stat }) {
  return (
    <View style={styles.fullStatsCard}>
      <View style={styles.recentTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recentOpponent}>{stat.opponent}</Text>
          <Text style={styles.statDate}>{stat.date}</Text>
        </View>

        <View style={styles.blueBadge}>
          <Text style={styles.blueBadgeText}>{stat.matchType}</Text>
        </View>
      </View>

      <View style={styles.fullStatsGrid}>
        <StatsBox icon="target" iconColor={COLORS.cyan} value={stat.goals} label="Goals" />
        <StatsBox icon="trending-up" iconColor={COLORS.blue} value={stat.assists} label="Assists" />
        <StatsBox icon="clock" iconColor={COLORS.purple} value={stat.minutesPlayed} label="Minutes" />
        <StatsBox isStar iconColor={COLORS.yellow} value={stat.rating} label="Rating" />
      </View>
    </View>
  );
}

function StatsBox({ icon, iconColor, value, label, isStar = false }) {
  return (
    <View style={styles.statsBox}>
      {isStar ? (
        <Ionicons name="star" size={16} color={iconColor} />
      ) : (
        <Feather name={icon} size={16} color={iconColor} />
      )}
      <Text style={styles.statsBoxValue}>{value}</Text>
      <Text style={styles.statsBoxLabel}>{label}</Text>
    </View>
  );
}

function HighlightsContent({ highlights, onUpload, onOpenHighlight }) {
  return (
    <View>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Video Highlights</Text>

        <TouchableOpacity activeOpacity={0.75} style={styles.smallAction} onPress={onUpload}>
          <Feather name="upload" size={14} color={COLORS.cyan} />
          <Text style={styles.smallActionText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {highlights.map((highlight) => (
        <TouchableOpacity
          key={highlight.id}
          activeOpacity={0.75}
          style={styles.highlightCard}
          onPress={() => onOpenHighlight(highlight)}
        >
          <View style={styles.highlightThumbnail}>
            <Image source={{ uri: highlight.thumbnail }} style={styles.highlightImage} />
            <View style={styles.highlightOverlay} />

            <View style={styles.highlightPlayButton}>
              <Feather name="play" size={22} color={COLORS.cyan} />
            </View>

            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{highlight.duration}</Text>
            </View>

            {highlight.verified && (
              <View style={styles.highlightVerified}>
                <Feather name="check" size={10} color={COLORS.white} />
                <Text style={styles.highlightVerifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.highlightInfo}>
            <Text style={styles.highlightTitle}>{highlight.title}</Text>

            <View style={styles.highlightMetaRow}>
              <Text style={styles.highlightDate}>{highlight.date}</Text>
              <Text style={styles.highlightViews}>{highlight.views} views</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function BottomTab({ icon, label, active, badge, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.bottomTab} onPress={onPress}>
      <View style={styles.bottomIconWrap}>
        <Feather
          name={icon}
          size={24}
          color={active ? COLORS.cyan : COLORS.gray500}
        />
        {badge && <View style={styles.bottomBadge} />}
      </View>

      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ModalHandle() {
  return <View style={styles.modalHandle} />;
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
}) {
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
        keyboardType={keyboardType}
      />
    </View>
  );
}

function BottomSheet({ visible, onClose, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.bottomSheet}>
          <ModalHandle />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EditProfileModal({
  visible,
  onClose,
  editForm,
  updateEditForm,
  onSave,
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <TouchableOpacity activeOpacity={0.75} style={styles.modalClose} onPress={onClose}>
        <Feather name="x" size={20} color={COLORS.gray600} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalTitle}>Edit Profile</Text>

        <FormInput
          label="Full Name"
          value={editForm.name}
          onChangeText={(text) => updateEditForm('name', text)}
          placeholder="Full name"
        />
        <FormInput
          label="Sport"
          value={editForm.sport}
          onChangeText={(text) => updateEditForm('sport', text)}
          placeholder="Sport"
        />
        <FormInput
          label="Position"
          value={editForm.position}
          onChangeText={(text) => updateEditForm('position', text)}
          placeholder="Position"
        />
        <FormInput
          label="Location"
          value={editForm.location}
          onChangeText={(text) => updateEditForm('location', text)}
          placeholder="Location"
        />
        <FormInput
          label="Team"
          value={editForm.team}
          onChangeText={(text) => updateEditForm('team', text)}
          placeholder="Team"
        />
        <FormInput
          label="About / Bio"
          value={editForm.about}
          onChangeText={(text) => updateEditForm('about', text)}
          placeholder="Write about yourself"
          multiline
        />

        <TouchableOpacity activeOpacity={0.75} style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.75} style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

function UploadHighlightModal({
  visible,
  onClose,
  uploadForm,
  updateUploadForm,
  onUpload,
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalTitle}>Upload Highlight Video</Text>

        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.uploadArea}
          onPress={() => Alert.alert('Upload', 'Video picker coming soon.')}
        >
          <Feather name="video" size={36} color={COLORS.gray400} />
          <Text style={styles.uploadAreaText}>Tap to select video</Text>
        </TouchableOpacity>

        <FormInput
          label="Video Title"
          value={uploadForm.title}
          onChangeText={(text) => updateUploadForm('title', text)}
          placeholder="Amazing Goal vs Cape Town"
        />

        <FormInput
          label="Duration"
          value={uploadForm.duration}
          onChangeText={(text) => updateUploadForm('duration', text)}
          placeholder="0:45"
          keyboardType="decimal-pad"
        />

        <TouchableOpacity activeOpacity={0.75} style={styles.saveButton} onPress={onUpload}>
          <Text style={styles.saveButtonText}>Upload Highlight</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.75} style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
}

function AddStatsModal({
  visible,
  onClose,
  statsForm,
  updateStatsForm,
  onSave,
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalTitle}>Add Match Stats</Text>

        <FormInput
          label="Opponent Team"
          value={statsForm.opponent}
          onChangeText={(text) => updateStatsForm('opponent', text)}
          placeholder="Cape Town United"
        />
        <FormInput
          label="Match Date"
          value={statsForm.date}
          onChangeText={(text) => updateStatsForm('date', text)}
          placeholder="May 20, 2026"
        />
        <FormInput
          label="Match Type"
          value={statsForm.matchType}
          onChangeText={(text) => updateStatsForm('matchType', text)}
          placeholder="League / Cup / Friendly"
        />
        <FormInput
          label="Goals"
          value={statsForm.goals}
          onChangeText={(text) => updateStatsForm('goals', text)}
          placeholder="0"
          keyboardType="numeric"
        />
        <FormInput
          label="Assists"
          value={statsForm.assists}
          onChangeText={(text) => updateStatsForm('assists', text)}
          placeholder="0"
          keyboardType="numeric"
        />
        <FormInput
          label="Minutes Played"
          value={statsForm.minutesPlayed}
          onChangeText={(text) => updateStatsForm('minutesPlayed', text)}
          placeholder="90"
          keyboardType="numeric"
        />
        <FormInput
          label="Match Rating"
          value={statsForm.rating}
          onChangeText={(text) => updateStatsForm('rating', text)}
          placeholder="8.5"
          keyboardType="decimal-pad"
        />

        <TouchableOpacity activeOpacity={0.75} style={styles.blueSaveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>Save Stats</Text>
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
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.videoClose}
          onPress={onClose}
        >
          <Feather name="x" size={20} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.videoPreviewContent}>
          <View style={styles.videoImageWrap}>
            <Image source={{ uri: highlight.thumbnail }} style={styles.videoPreviewImage} />
            <View style={styles.videoPreviewOverlay} />

            <View style={styles.videoBigPlay}>
              <Feather name="play" size={28} color={COLORS.cyan} />
            </View>
          </View>

          <Text style={styles.videoTitle}>{highlight.title}</Text>
          <Text style={styles.videoMeta}>
            {highlight.duration} • {highlight.views} views
          </Text>

          {highlight.verified && (
            <View style={styles.videoVerifiedBadge}>
              <Feather name="check" size={12} color={COLORS.white} />
              <Text style={styles.videoVerifiedText}>Verified</Text>
            </View>
          )}

          <Text style={styles.videoNote}>
            This is a video preview. Playback coming soon.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },

  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  floatingRight: {
    flexDirection: 'row',
    gap: 8,
  },

  floatingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  scrollContent: {
    paddingBottom: 80,
  },

  coverContainer: {
    height: 192,
    position: 'relative',
  },

  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  coverCamera: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.overlayDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    backgroundColor: COLORS.white,
    marginTop: -48,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  avatarWrapper: {
    width: 112,
    height: 112,
    marginTop: -56,
    position: 'relative',
  },

  avatarGradient: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: COLORS.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  avatarCamera: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nameRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
  },

  verifiedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sportLine: {
    fontSize: 14,
    color: COLORS.gray700,
    fontWeight: '500',
    marginTop: 4,
  },

  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },

  infoLineText: {
    fontSize: 13,
    color: COLORS.gray600,
  },

  engagementRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 20,
  },

  inlineStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  inlineValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },

  inlineLabel: {
    fontSize: 12,
    color: COLORS.gray500,
  },

  performanceGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  performanceCell: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },

  performanceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
  },

  performanceLabel: {
    fontSize: 11,
    color: COLORS.gray600,
    fontWeight: '500',
  },

  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },

  editButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  statsButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  actionButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },

  completionCard: {
    backgroundColor: COLORS.white,
    marginTop: 12,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  completionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  completionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },

  completionPercent: {
    fontSize: 13,
    color: COLORS.cyan,
    fontWeight: '600',
  },

  progressTrack: {
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 12,
  },

  progressFill: {
    height: 8,
    backgroundColor: COLORS.cyan,
    borderRadius: 4,
  },

  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },

  emptyCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.gray300,
  },

  checklistText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray700,
  },

  tabsContainer: {
    marginTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gray200,
    flexDirection: 'row',
  },

  profileTab: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  profileTabText: {
    fontSize: 14,
    color: COLORS.gray600,
    fontWeight: '500',
  },

  profileTabTextActive: {
    color: COLORS.cyan,
    fontWeight: '600',
  },

  activeTabLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.cyan,
  },

  tabContent: {
    backgroundColor: COLORS.white,
    padding: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
  },

  aboutText: {
    fontSize: 14,
    color: COLORS.gray700,
    lineHeight: 22,
  },

  sectionHeaderRow: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  smallActionText: {
    color: COLORS.cyan,
    fontWeight: '600',
    fontSize: 13,
  },

  recentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: 14,
    marginBottom: 10,
  },

  recentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  recentOpponent: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },

  matchTypeBadge: {
    backgroundColor: COLORS.cyanLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },

  matchTypeText: {
    color: COLORS.cyan,
    fontWeight: '700',
    fontSize: 11,
  },

  statDate: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 4,
    marginBottom: 10,
  },

  recentStatsRow: {
    flexDirection: 'row',
  },

  miniStat: {
    flex: 1,
    alignItems: 'center',
  },

  miniValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },

  miniLabel: {
    fontSize: 11,
    color: COLORS.gray600,
  },

  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  achievementIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  achievementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },

  achievementSubtitle: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },

  achievementDate: {
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 2,
  },

  fullStatsCard: {
    backgroundColor: COLORS.blueLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    padding: 14,
    marginBottom: 10,
  },

  blueBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  blueBadgeText: {
    color: COLORS.blueDark,
    fontSize: 11,
    fontWeight: '700',
  },

  fullStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  statsBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },

  statsBoxValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 4,
  },

  statsBoxLabel: {
    fontSize: 10,
    color: COLORS.gray600,
  },

  highlightCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: 14,
    backgroundColor: COLORS.white,
  },

  highlightThumbnail: {
    width: '100%',
    height: HIGHLIGHT_HEIGHT,
    position: 'relative',
  },

  highlightImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  highlightPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 56,
    height: 56,
    borderRadius: 28,
    marginTop: -28,
    marginLeft: -28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  durationBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  durationText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  highlightVerified: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  highlightVerifiedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },

  highlightInfo: {
    padding: 12,
    backgroundColor: COLORS.white,
  },

  highlightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },

  highlightMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
  },

  highlightDate: {
    flex: 1,
    color: COLORS.gray600,
    fontSize: 12,
  },

  highlightViews: {
    color: COLORS.gray500,
    fontSize: 12,
  },

  bottomNav: {
    height: 64,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },

  bottomIconWrap: {
    position: 'relative',
  },

  bottomBadge: {
    position: 'absolute',
    top: 0,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.red,
  },

  bottomLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.gray500,
  },

  bottomLabelActive: {
    color: COLORS.cyan,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },

  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
    marginBottom: 16,
  },

  modalClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 20,
  },

  formField: {
    marginBottom: 14,
  },

  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: 6,
  },

  formInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },

  formTextArea: {
    height: 80,
    paddingTop: 12,
  },

  saveButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  blueSaveButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },

  cancelButton: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  cancelText: {
    color: COLORS.gray500,
    fontSize: 14,
    fontWeight: '500',
  },

  uploadArea: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.gray100,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },

  uploadAreaText: {
    fontSize: 14,
    color: COLORS.gray500,
  },

  videoModal: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },

  videoClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  videoPreviewContent: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  videoImageWrap: {
    width: '100%',
    height: SCREEN_WIDTH * 0.5625,
    position: 'relative',
  },

  videoPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  videoPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  videoBigPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 72,
    height: 72,
    borderRadius: 36,
    marginLeft: -36,
    marginTop: -36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  videoTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },

  videoMeta: {
    color: COLORS.gray300,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },

  videoVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 12,
  },

  videoVerifiedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  videoNote: {
    color: COLORS.gray400,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});