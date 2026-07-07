import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const scale = SCREEN_WIDTH / 390;
const responsive = size => Math.round(size * Math.min(scale, 1.18));

const DASHBOARD_STATS = [
  {
    id: 'ds1',
    label: 'Players',
    value: '24',
    icon: 'people-outline',
    gradientStart: '#EFF6FF',
    gradientEnd: '#DBEAFE',
    iconColor: '#2563EB',
  },
  {
    id: 'ds2',
    label: 'Matches Won',
    value: '12',
    icon: 'trophy-outline',
    gradientStart: '#ECFEFF',
    gradientEnd: '#CFFAFE',
    iconColor: '#0891B2',
  },
  {
    id: 'ds3',
    label: 'Avg Rating',
    value: '8.4',
    icon: 'trending-up-outline',
    gradientStart: '#EFF6FF',
    gradientEnd: '#DBEAFE',
    iconColor: '#2563EB',
  },
];

const QUICK_ACTIONS = [
  {
    id: 'qa1',
    label: 'Upload Fixture',
    icon: 'add-circle-outline',
    modal: 'uploadFixture',
    gradientStart: '#06B6D4',
    gradientEnd: '#3B82F6',
  },
  {
    id: 'qa2',
    label: 'Match Result',
    icon: 'document-text-outline',
    modal: 'uploadResult',
    gradientStart: '#3B82F6',
    gradientEnd: '#0891B2',
  },
  {
    id: 'qa3',
    label: 'Verify Stats',
    icon: 'bar-chart-outline',
    modal: 'verifyStats',
    gradientStart: '#0891B2',
    gradientEnd: '#3B82F6',
  },
  {
    id: 'qa4',
    label: 'Verify Videos',
    icon: 'videocam-outline',
    modal: 'verifyHighlights',
    gradientStart: '#2563EB',
    gradientEnd: '#06B6D4',
  },
  {
    id: 'qa5',
    label: 'Manage Competition',
    icon: 'trophy-outline',
    modal: 'manageCompetition',
    gradientStart: '#3B82F6',
    gradientEnd: '#06B6D4',
  },
  {
    id: 'qa6',
    label: 'Send Notification',
    icon: 'notifications-outline',
    modal: 'sendNotification',
    gradientStart: '#06B6D4',
    gradientEnd: '#2563EB',
  },
];

const DEFAULT_FIXTURES = [
  {
    id: 'f1',
    opponent: 'Johannesburg FC',
    date: 'May 20, 2026',
    time: '15:00',
    venue: 'Home',
  },
  {
    id: 'f2',
    opponent: 'Durban United',
    date: 'May 27, 2026',
    time: '14:30',
    venue: 'Away',
  },
];

const DEFAULT_PLAYERS = [
  {
    id: 'p1',
    name: 'Themba Nkosi',
    position: 'Midfielder',
    stats: '18 Goals • 12 Assists',
    rating: 8.5,
    verified: false,
    pendingVerification: true,
    recommended: false,
  },
  {
    id: 'p2',
    name: 'Sipho Dlamini',
    position: 'Striker',
    stats: '24 Goals • 8 Assists',
    rating: 8.9,
    verified: true,
    pendingVerification: false,
    recommended: true,
  },
  {
    id: 'p3',
    name: 'Lerato Mbatha',
    position: 'Defender',
    stats: '5 Goals • 15 Assists',
    rating: 8.2,
    verified: true,
    pendingVerification: false,
    recommended: false,
  },
];

const DEFAULT_HIGHLIGHTS = [
  {
    id: 'h1',
    playerName: 'Themba Nkosi',
    description: 'Amazing solo goal from midfield',
    date: 'May 16, 2026',
    duration: '0:45',
  },
  {
    id: 'h2',
    playerName: 'Sipho Dlamini',
    description: 'Hat-trick performance highlights',
    date: 'May 15, 2026',
    duration: '2:30',
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

function QuickActionButton({ action, onPress }) {
  return (
    <TouchableOpacity
      style={styles.quickActionWrapper}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[action.gradientStart, action.gradientEnd]}
        style={styles.quickAction}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={action.icon} size={28} color="#ffffff" />
        <Text style={styles.quickActionLabel}>{action.label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function FixtureCard({ fixture }) {
  const isHome = fixture.venue === 'Home';

  return (
    <View style={styles.fixtureCard}>
      <View style={styles.fixtureTopRow}>
        <Text style={styles.fixtureOpponent}>{fixture.opponent}</Text>

        <View
          style={[
            styles.venueBadge,
            { backgroundColor: isHome ? '#ECFEFF' : '#EFF6FF' },
          ]}
        >
          <Text
            style={[
              styles.venueBadgeText,
              { color: isHome ? '#0891B2' : '#2563EB' },
            ]}
          >
            {fixture.venue}
          </Text>
        </View>
      </View>

      <View style={styles.fixtureMeta}>
        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
        <Text style={styles.fixtureMetaText}>{fixture.date}</Text>

        <Ionicons
          name="time-outline"
          size={14}
          color="#6B7280"
          style={styles.fixtureTimeIcon}
        />
        <Text style={styles.fixtureMetaText}>{fixture.time}</Text>
      </View>
    </View>
  );
}

function PlayerCard({ player, onVerify, onRecommend }) {
  return (
    <View style={styles.playerCard}>
      <View style={styles.playerRow}>
        <LinearGradient
          colors={['#06B6D4', '#3B82F6']}
          style={styles.playerAvatar}
        >
          <Text style={styles.playerAvatarText}>{player.name.charAt(0)}</Text>
        </LinearGradient>

        <View style={styles.playerInfo}>
          <View style={styles.playerNameRow}>
            <Text style={styles.playerName}>{player.name}</Text>

            {player.verified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#06B6D4"
                style={styles.verifiedIcon}
              />
            )}

            {player.pendingVerification && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            )}
          </View>

          <Text style={styles.playerPosition}>{player.position}</Text>
          <Text style={styles.playerStats}>{player.stats}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#EAB308" />
            <Text style={styles.ratingText}>{player.rating}</Text>
          </View>
        </View>
      </View>

      <View style={styles.playerActions}>
        {player.pendingVerification && (
          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={onVerify}
            activeOpacity={0.85}
          >
            <Text style={styles.verifyBtnText}>Verify Stats</Text>
          </TouchableOpacity>
        )}

        {player.verified && !player.recommended && (
          <TouchableOpacity
            style={styles.recommendBtn}
            onPress={onRecommend}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add-outline" size={14} color="#ffffff" />
            <Text style={styles.recommendBtnText}>Recommend</Text>
          </TouchableOpacity>
        )}

        {player.recommended && (
          <View style={styles.recommendedTag}>
            <Ionicons name="checkmark-circle" size={14} color="#2563EB" />
            <Text style={styles.recommendedTagText}>Recommended</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ModalShell({ visible, title, onClose, children }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>

      <TextInput
        style={[styles.formInput, multiline && styles.formTextArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export default function CoachDashboardScreen({ onNavigate }) {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('home');
  const [activeModal, setActiveModal] = useState(null);

  const [teamPlayers, setTeamPlayers] = useState(DEFAULT_PLAYERS);
  const [pendingHighlights, setPendingHighlights] = useState(DEFAULT_HIGHLIGHTS);
  const [fixtures, setFixtures] = useState(DEFAULT_FIXTURES);

  const [resultOpponent, setResultOpponent] = useState('');
  const [resultOurScore, setResultOurScore] = useState('');
  const [resultTheirScore, setResultTheirScore] = useState('');
  const [resultDate, setResultDate] = useState('');
  const [resultPerformers, setResultPerformers] = useState('');
  const [resultNotes, setResultNotes] = useState('');

  const [fixtureOpponent, setFixtureOpponent] = useState('');
  const [fixtureDate, setFixtureDate] = useState('');
  const [fixtureTime, setFixtureTime] = useState('');
  const [fixtureVenue, setFixtureVenue] = useState('Home');
  const [fixtureLocation, setFixtureLocation] = useState('');

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState('All Players');

  const [competitionName, setCompetitionName] = useState('');
  const [competitionDate, setCompetitionDate] = useState('');
  const [competitionVenue, setCompetitionVenue] = useState('');

  const goTo = (screen, params) => {
    if (onNavigate) {
      onNavigate(screen, params);
    } else {
      navigation.navigate(screen, params);
    }
  };

  const openModal = modal => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleTabPress = tab => {
    setActiveTab(tab);

    if (tab === 'messages') {
      goTo('Messages');
    }

    if (tab === 'profile') {
      goTo('CoachProfile');
    }
  };

  const handleVerifyPlayer = playerId => {
    setTeamPlayers(prev =>
      prev.map(player =>
        player.id === playerId
          ? { ...player, verified: true, pendingVerification: false }
          : player
      )
    );

    Alert.alert('Verified', 'Player statistics have been verified successfully.');
  };

  const handleRecommendPlayer = playerId => {
    setTeamPlayers(prev =>
      prev.map(player =>
        player.id === playerId ? { ...player, recommended: true } : player
      )
    );

    Alert.alert('Recommended', 'Player has been recommended to scouts.');
  };

  const handleApproveHighlight = highlightId => {
    setPendingHighlights(prev =>
      prev.filter(highlight => highlight.id !== highlightId)
    );

    Alert.alert('Approved', 'Highlight video has been approved and published.');
  };

  const handleRejectHighlight = highlightId => {
    setPendingHighlights(prev =>
      prev.filter(highlight => highlight.id !== highlightId)
    );

    Alert.alert('Rejected', 'Highlight video has been rejected.');
  };

  const handleSubmitResult = () => {
    if (!resultOpponent.trim()) {
      Alert.alert('Error', 'Please enter opponent team name.');
      return;
    }

    Alert.alert('Success', 'Match result submitted successfully!');

    setResultOpponent('');
    setResultOurScore('');
    setResultTheirScore('');
    setResultDate('');
    setResultPerformers('');
    setResultNotes('');

    closeModal();
  };

  const handleSubmitFixture = () => {
    if (!fixtureOpponent.trim()) {
      Alert.alert('Error', 'Please enter opponent team name.');
      return;
    }

    const newFixture = {
      id: `f${Date.now()}`,
      opponent: fixtureOpponent,
      date: fixtureDate || 'Date TBC',
      time: fixtureTime || 'Time TBC',
      venue: fixtureVenue,
    };

    setFixtures(prev => [newFixture, ...prev]);

    Alert.alert('Success', 'Fixture created successfully!');

    setFixtureOpponent('');
    setFixtureDate('');
    setFixtureTime('');
    setFixtureVenue('Home');
    setFixtureLocation('');

    closeModal();
  };

  const handleSendNotification = () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      Alert.alert('Error', 'Please fill in title and message.');
      return;
    }

    Alert.alert('Sent', `Notification sent to ${notifTarget}.`);

    setNotifTitle('');
    setNotifMessage('');
    setNotifTarget('All Players');

    closeModal();
  };

  const handleCreateCompetition = () => {
    if (!competitionName.trim()) {
      Alert.alert('Error', 'Please enter competition name.');
      return;
    }

    Alert.alert('Created', 'Competition created successfully!');

    setCompetitionName('');
    setCompetitionDate('');
    setCompetitionVenue('');

    closeModal();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PRIME SCOUT</Text>
          <Text style={styles.headerSubtitle}>Coach Dashboard</Text>
        </View>

        <View style={styles.headerIcons}>
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
            onPress={() => goTo('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#06B6D4', '#2563EB']}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroTextWrapper}>
              <Text style={styles.heroTitle}>Manage Your Team</Text>
              <Text style={styles.heroSubtitle}>
                Track athletes, verify stats, upload fixtures, and guide your
                squad toward new opportunities.
              </Text>
            </View>

            <View style={styles.heroIconCircle}>
              <Ionicons name="clipboard-outline" size={32} color="#ffffff" />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Overview</Text>

          <View style={styles.statsRow}>
            {DASHBOARD_STATS.map(stat => (
              <DashboardStatCard key={stat.id} stat={stat} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coach Actions</Text>

          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.slice(0, 2).map(action => (
              <QuickActionButton
                key={action.id}
                action={action}
                onPress={() => openModal(action.modal)}
              />
            ))}
          </View>

          <View style={[styles.quickActionsGrid, styles.quickActionsSpacing]}>
            {QUICK_ACTIONS.slice(2, 4).map(action => (
              <QuickActionButton
                key={action.id}
                action={action}
                onPress={() => openModal(action.modal)}
              />
            ))}
          </View>

          <View style={[styles.quickActionsGrid, styles.quickActionsSpacing]}>
            {QUICK_ACTIONS.slice(4, 6).map(action => (
              <QuickActionButton
                key={action.id}
                action={action}
                onPress={() => openModal(action.modal)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.manageTeamBtnWrapper}
            onPress={() => openModal('manageTeam')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#06B6D4', '#3B82F6']}
              style={styles.manageTeamBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="people-outline" size={22} color="#ffffff" />
              <Text style={styles.manageTeamBtnText}>
                Manage Team / Athletes
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Fixtures</Text>

            <TouchableOpacity onPress={() => openModal('uploadFixture')}>
              <Text style={styles.linkText}>Add More</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fixtureList}>
            {fixtures.map(fixture => (
              <FixtureCard key={fixture.id} fixture={fixture} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Team Players</Text>

            <TouchableOpacity onPress={() => openModal('manageTeam')}>
              <Text style={styles.linkText}>Manage</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.playerList}>
            {teamPlayers.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                onVerify={() => handleVerifyPlayer(player.id)}
                onRecommend={() => handleRecommendPlayer(player.id)}
              />
            ))}
          </View>
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

      <ModalShell
        visible={activeModal === 'uploadResult'}
        title="Upload Match Result"
        onClose={closeModal}
      >
        <View style={styles.modalBody}>
          <FormField
            label="Opponent Team"
            value={resultOpponent}
            onChangeText={setResultOpponent}
            placeholder="Enter opponent name"
          />

          <View style={styles.scoreRow}>
            <View style={styles.scoreInputBox}>
              <FormField
                label="Your Score"
                value={resultOurScore}
                onChangeText={setResultOurScore}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.scoreDivider}>
              <Text style={styles.scoreDividerText}>vs</Text>
            </View>

            <View style={styles.scoreInputBox}>
              <FormField
                label="Opponent Score"
                value={resultTheirScore}
                onChangeText={setResultTheirScore}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <FormField
            label="Match Date"
            value={resultDate}
            onChangeText={setResultDate}
            placeholder="e.g. May 20, 2026"
          />

          <FormField
            label="Top Performers"
            value={resultPerformers}
            onChangeText={setResultPerformers}
            placeholder="List top performing players and their stats..."
            multiline
            numberOfLines={3}
          />

          <FormField
            label="Match Notes"
            value={resultNotes}
            onChangeText={setResultNotes}
            placeholder="Additional notes, highlights, observations..."
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitResult}>
            <Text style={styles.submitBtnText}>Submit Match Result</Text>
          </TouchableOpacity>
        </View>
      </ModalShell>

      <ModalShell
        visible={activeModal === 'uploadFixture'}
        title="Upload Fixture"
        onClose={closeModal}
      >
        <View style={styles.modalBody}>
          <FormField
            label="Opponent Team"
            value={fixtureOpponent}
            onChangeText={setFixtureOpponent}
            placeholder="Enter opponent name"
          />

          <FormField
            label="Match Date"
            value={fixtureDate}
            onChangeText={setFixtureDate}
            placeholder="e.g. May 20, 2026"
          />

          <FormField
            label="Kick-off Time"
            value={fixtureTime}
            onChangeText={setFixtureTime}
            placeholder="e.g. 15:00"
          />

          <Text style={styles.formLabel}>Venue</Text>

          <View style={styles.venueToggle}>
            {['Home', 'Away'].map(venue => (
              <TouchableOpacity
                key={venue}
                style={[
                  styles.venueOption,
                  fixtureVenue === venue && styles.venueOptionActive,
                ]}
                onPress={() => setFixtureVenue(venue)}
              >
                <Text
                  style={[
                    styles.venueOptionText,
                    fixtureVenue === venue && styles.venueOptionTextActive,
                  ]}
                >
                  {venue}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormField
            label="Location / Stadium"
            value={fixtureLocation}
            onChangeText={setFixtureLocation}
            placeholder="Stadium or field name"
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmitFixture}
          >
            <Text style={styles.submitBtnText}>Create Fixture</Text>
          </TouchableOpacity>
        </View>
      </ModalShell>

      <ModalShell
        visible={activeModal === 'verifyStats'}
        title="Verify Player Statistics"
        onClose={closeModal}
      >
        <View style={styles.modalBody}>
          {teamPlayers.filter(player => player.pendingVerification).length ===
          0 ? (
            <View style={styles.emptyModal}>
              <Ionicons name="checkmark-circle" size={52} color="#06B6D4" />
              <Text style={styles.emptyModalText}>No pending verifications</Text>
            </View>
          ) : (
            teamPlayers
              .filter(player => player.pendingVerification)
              .map(player => (
                <View key={player.id} style={styles.verifyCard}>
                  <View style={styles.verifyCardHeader}>
                    <LinearGradient
                      colors={['#06B6D4', '#3B82F6']}
                      style={styles.verifyAvatar}
                    >
                      <Text style={styles.verifyAvatarText}>
                        {player.name.charAt(0)}
                      </Text>
                    </LinearGradient>

                    <View style={styles.verifyPlayerInfo}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <Text style={styles.playerPosition}>
                        {player.position}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.verifyStatsBox}>
                    <Text style={styles.verifyStatText}>
                      <Text style={styles.boldText}>Stats: </Text>
                      {player.stats}
                    </Text>

                    <Text style={styles.verifyStatText}>
                      <Text style={styles.boldText}>Rating: </Text>
                      {player.rating}/10
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={() => {
                      handleVerifyPlayer(player.id);
                      closeModal();
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#ffffff"
                    />
                    <Text style={styles.submitBtnText}>
                      {'  '}Verify Statistics
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
          )}
        </View>
      </ModalShell>

      <ModalShell
        visible={activeModal === 'verifyHighlights'}
        title="Verify Highlight Videos"
        onClose={closeModal}
      >
        <View style={styles.modalBody}>
          {pendingHighlights.length === 0 ? (
            <View style={styles.emptyModal}>
              <Ionicons name="checkmark-circle" size={52} color="#06B6D4" />
              <Text style={styles.emptyModalText}>No pending highlights</Text>
            </View>
          ) : (
            pendingHighlights.map(highlight => (
              <View key={highlight.id} style={styles.highlightCard}>
                <View style={styles.highlightCardTop}>
                  <View>
                    <Text style={styles.playerName}>{highlight.playerName}</Text>
                    <Text style={styles.playerPosition}>{highlight.date}</Text>
                  </View>

                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{highlight.duration}</Text>
                  </View>
                </View>

                <View style={styles.videoPlaceholder}>
                  <Ionicons
                    name="videocam-outline"
                    size={40}
                    color="#9CA3AF"
                  />
                  <Text style={styles.videoPlaceholderText}>
                    Tap to preview
                  </Text>
                </View>

                <Text style={styles.highlightDesc}>
                  {highlight.description}
                </Text>

                <View style={styles.highlightActions}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApproveHighlight(highlight.id)}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={16}
                      color="#ffffff"
                    />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleRejectHighlight(highlight.id)}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ModalShell>

      <ModalShell
        visible={activeModal === 'manageTeam'}
        title="Manage Team"
        onClose={closeModal}
      >
        <View style={styles.modalBody}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => Alert.alert('Add Player', 'Add player form coming soon.')}
          >
            <Ionicons name="person-add-outline" size={18} color="#ffffff" />
            <Text style={styles.submitBtnText}> Add New Player</Text>
          </TouchableOpacity>

          <View style={styles.managePlayerList}>
            {teamPlayers.map(player => (
              <View key={player.id} style={styles.managePlayerCard}>
                <View style={styles.managePlayerRow}>
                  <LinearGradient
                    colors={['#06B6D4', '#3B82F6']}
                    style={styles.manageAvatar}
                  >
                    <Text style={styles.manageAvatarText}>
                      {player.name.charAt(0)}
                    </Text>
                  </LinearGradient>

                  <View style={styles.managePlayerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerPosition}>{player.position}</Text>
                  </View>

                  {player.verified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#06B6D4"
                    />
                  )}
                </View>

                <View style={styles.manageActions}>
                  <TouchableOpacity
                    style={styles.manageEditBtn}
                    onPress={() =>
                      Alert.alert('Edit Player', `${player.name} edit coming soon.`)
                    }
                  >
                    <Text style={styles.manageEditText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.manageStatsBtn}
                    onPress={() =>
                      Alert.alert('Player Stats', `${player.stats}`)
                    }
                  >
                    <Text style={styles.manageStatsText}>View Stats</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ModalShell>

      <ModalShell
        visible={activeModal === 'manageCompetition'}
        title="Manage Competition"
        onClose={closeModal}
      >
        <View style={styles.modalBody}>
          <FormField
            label="Competition Name"
            value={competitionName}
            onChangeText={setCompetitionName}
            placeholder="e.g. Regional Youth Cup 2026"
          />

          <FormField
            label="Start Date"
            value={competitionDate}
            onChangeText={setCompetitionDate}
            placeholder="e.g. June 1, 2026"
          />

          <FormField
            label="Venue / Location"
            value={competitionVenue}
            onChangeText={setCompetitionVenue}
            placeholder="e.g. Soccer City, Johannesburg"
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleCreateCompetition}
          >
            <Text style={styles.submitBtnText}>Create Competition</Text>
          </TouchableOpacity>
        </View>
      </ModalShell>

      <ModalShell
        visible={activeModal === 'sendNotification'}
        title="Send Notification"
        onClose={closeModal}
      >
        <View style={styles.modalBody}>
          <Text style={styles.formLabel}>Send To</Text>

          <View style={styles.targetRow}>
            {['All Players', 'Specific Player', 'Parents'].map(target => (
              <TouchableOpacity
                key={target}
                style={[
                  styles.targetChip,
                  notifTarget === target && styles.targetChipActive,
                ]}
                onPress={() => setNotifTarget(target)}
              >
                <Text
                  style={[
                    styles.targetChipText,
                    notifTarget === target && styles.targetChipTextActive,
                  ]}
                >
                  {target}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormField
            label="Notification Title"
            value={notifTitle}
            onChangeText={setNotifTitle}
            placeholder="e.g. Training tomorrow cancelled"
          />

          <FormField
            label="Message"
            value={notifMessage}
            onChangeText={setNotifMessage}
            placeholder="Write your message here..."
            multiline
            numberOfLines={5}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSendNotification}
          >
            <Ionicons name="send-outline" size={16} color="#ffffff" />
            <Text style={styles.submitBtnText}> Send Notification</Text>
          </TouchableOpacity>
        </View>
      </ModalShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: responsive(24),
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
  },

  headerSubtitle: {
    fontSize: responsive(12),
    color: '#6B7280',
    marginTop: 2,
  },

  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(4),
  },

  iconBtn: {
    padding: responsive(8),
    borderRadius: responsive(8),
    position: 'relative',
  },

  badgeDot: {
    position: 'absolute',
    top: responsive(6),
    right: responsive(6),
    width: responsive(8),
    height: responsive(8),
    borderRadius: responsive(4),
    backgroundColor: '#EF4444',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsive(12),
  },

  linkText: {
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
    borderRadius: responsive(12),
    paddingVertical: responsive(14),
    paddingHorizontal: responsive(8),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: responsive(104),
  },

  statValue: {
    fontSize: responsive(22),
    fontWeight: '800',
    color: '#000000',
    marginTop: responsive(4),
  },

  statLabel: {
    fontSize: responsive(11),
    color: '#6B7280',
    textAlign: 'center',
  },

  quickActionsGrid: {
    flexDirection: 'row',
    gap: responsive(10),
  },

  quickActionsSpacing: {
    marginTop: responsive(10),
  },

  quickActionWrapper: {
    flex: 1,
  },

  quickAction: {
    borderRadius: responsive(14),
    padding: responsive(16),
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive(8),
    minHeight: responsive(102),
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  quickActionLabel: {
    fontSize: responsive(12),
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },

  manageTeamBtnWrapper: {
    marginTop: responsive(10),
  },

  manageTeamBtn: {
    borderRadius: responsive(14),
    paddingVertical: responsive(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive(10),
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  manageTeamBtnText: {
    fontSize: responsive(15),
    fontWeight: '700',
    color: '#ffffff',
  },

  fixtureList: {
    gap: responsive(10),
  },

  fixtureCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: responsive(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: responsive(14),
  },

  fixtureTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsive(8),
  },

  fixtureOpponent: {
    flex: 1,
    fontSize: responsive(15),
    fontWeight: '700',
    color: '#000000',
    marginRight: responsive(8),
  },

  venueBadge: {
    borderRadius: responsive(12),
    paddingHorizontal: responsive(10),
    paddingVertical: responsive(4),
  },

  venueBadgeText: {
    fontSize: responsive(12),
    fontWeight: '600',
  },

  fixtureMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  fixtureMetaText: {
    fontSize: responsive(13),
    color: '#6B7280',
    marginLeft: responsive(4),
  },

  fixtureTimeIcon: {
    marginLeft: responsive(12),
  },

  playerList: {
    gap: responsive(12),
  },

  playerCard: {
    backgroundColor: '#ffffff',
    borderRadius: responsive(14),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: responsive(14),
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  playerAvatar: {
    width: responsive(52),
    height: responsive(52),
    borderRadius: responsive(26),
    alignItems: 'center',
    justifyContent: 'center',
  },

  playerAvatarText: {
    fontSize: responsive(20),
    fontWeight: '800',
    color: '#ffffff',
  },

  playerInfo: {
    flex: 1,
    marginLeft: responsive(12),
  },

  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: responsive(2),
  },

  playerName: {
    fontSize: responsive(15),
    fontWeight: '700',
    color: '#000000',
  },

  verifiedIcon: {
    marginLeft: responsive(4),
  },

  pendingBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: responsive(10),
    paddingHorizontal: responsive(8),
    paddingVertical: responsive(2),
    marginLeft: responsive(6),
  },

  pendingBadgeText: {
    fontSize: responsive(11),
    fontWeight: '600',
    color: '#B45309',
  },

  playerPosition: {
    fontSize: responsive(13),
    color: '#374151',
    marginBottom: responsive(2),
  },

  playerStats: {
    fontSize: responsive(12),
    color: '#6B7280',
    marginBottom: responsive(4),
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(3),
  },

  ratingText: {
    fontSize: responsive(14),
    fontWeight: '700',
    color: '#000000',
  },

  playerActions: {
    flexDirection: 'row',
    gap: responsive(8),
    marginTop: responsive(12),
  },

  verifyBtn: {
    flex: 1,
    backgroundColor: '#06B6D4',
    borderRadius: responsive(20),
    paddingVertical: responsive(10),
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifyBtnText: {
    fontSize: responsive(13),
    fontWeight: '600',
    color: '#ffffff',
  },

  recommendBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    borderRadius: responsive(20),
    paddingVertical: responsive(10),
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive(4),
  },

  recommendBtnText: {
    fontSize: responsive(13),
    fontWeight: '600',
    color: '#ffffff',
  },

  recommendedTag: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderRadius: responsive(20),
    paddingVertical: responsive(10),
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive(4),
  },

  recommendedTagText: {
    fontSize: responsive(13),
    fontWeight: '600',
    color: '#2563EB',
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
  },

  navBadgeDot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: responsive(8),
    height: responsive(8),
    borderRadius: responsive(4),
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: responsive(24),
    borderTopRightRadius: responsive(24),
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? responsive(36) : responsive(24),
  },

  modalHandle: {
    width: responsive(40),
    height: responsive(4),
    borderRadius: responsive(2),
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: responsive(12),
    marginBottom: responsive(4),
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsive(20),
    paddingVertical: responsive(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  modalTitle: {
    fontSize: responsive(18),
    fontWeight: '700',
    color: '#000000',
  },

  modalCloseBtn: {
    width: responsive(32),
    height: responsive(32),
    borderRadius: responsive(16),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBody: {
    padding: responsive(20),
    gap: responsive(4),
  },

  formField: {
    marginBottom: responsive(14),
  },

  formLabel: {
    fontSize: responsive(14),
    fontWeight: '500',
    color: '#374151',
    marginBottom: responsive(6),
  },

  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: responsive(10),
    paddingHorizontal: responsive(14),
    paddingVertical: responsive(12),
    fontSize: responsive(14),
    color: '#000000',
  },

  formTextArea: {
    minHeight: responsive(90),
    textAlignVertical: 'top',
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(8),
    marginBottom: responsive(4),
  },

  scoreInputBox: {
    flex: 1,
  },

  scoreDivider: {
    paddingTop: responsive(24),
    alignItems: 'center',
  },

  scoreDividerText: {
    fontSize: responsive(13),
    fontWeight: '600',
    color: '#6B7280',
  },

  venueToggle: {
    flexDirection: 'row',
    gap: responsive(10),
    marginBottom: responsive(14),
  },

  venueOption: {
    flex: 1,
    paddingVertical: responsive(12),
    borderRadius: responsive(10),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },

  venueOptionActive: {
    borderColor: '#06B6D4',
    backgroundColor: '#ECFEFF',
  },

  venueOptionText: {
    fontSize: responsive(14),
    fontWeight: '600',
    color: '#6B7280',
  },

  venueOptionTextActive: {
    color: '#06B6D4',
  },

  targetRow: {
    flexDirection: 'row',
    gap: responsive(8),
    marginBottom: responsive(14),
    flexWrap: 'wrap',
  },

  targetChip: {
    paddingHorizontal: responsive(14),
    paddingVertical: responsive(8),
    borderRadius: responsive(20),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },

  targetChipActive: {
    borderColor: '#06B6D4',
    backgroundColor: '#ECFEFF',
  },

  targetChipText: {
    fontSize: responsive(13),
    fontWeight: '500',
    color: '#6B7280',
  },

  targetChipTextActive: {
    color: '#06B6D4',
    fontWeight: '600',
  },

  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#06B6D4',
    borderRadius: responsive(24),
    paddingVertical: responsive(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsive(8),
  },

  submitBtnText: {
    fontSize: responsive(15),
    fontWeight: '600',
    color: '#ffffff',
  },

  verifyCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: responsive(14),
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: responsive(14),
    marginBottom: responsive(12),
  },

  verifyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsive(10),
  },

  verifyAvatar: {
    width: responsive(44),
    height: responsive(44),
    borderRadius: responsive(22),
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifyAvatarText: {
    fontSize: responsive(18),
    fontWeight: '800',
    color: '#ffffff',
  },

  verifyPlayerInfo: {
    marginLeft: responsive(12),
  },

  verifyStatsBox: {
    backgroundColor: '#ffffff',
    borderRadius: responsive(8),
    padding: responsive(10),
    marginBottom: responsive(10),
    gap: responsive(4),
  },

  verifyStatText: {
    fontSize: responsive(13),
    color: '#374151',
  },

  boldText: {
    fontWeight: '700',
  },

  highlightCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: responsive(14),
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: responsive(14),
    marginBottom: responsive(12),
  },

  highlightCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: responsive(10),
  },

  durationBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: responsive(10),
    paddingHorizontal: responsive(10),
    paddingVertical: responsive(4),
  },

  durationText: {
    fontSize: responsive(12),
    fontWeight: '600',
    color: '#2563EB',
  },

  videoPlaceholder: {
    height: responsive(120),
    borderRadius: responsive(10),
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsive(10),
    gap: responsive(6),
  },

  videoPlaceholderText: {
    fontSize: responsive(13),
    color: '#9CA3AF',
  },

  highlightDesc: {
    fontSize: responsive(13),
    color: '#374151',
    marginBottom: responsive(10),
  },

  highlightActions: {
    flexDirection: 'row',
    gap: responsive(10),
  },

  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#06B6D4',
    borderRadius: responsive(20),
    paddingVertical: responsive(11),
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive(4),
  },

  approveBtnText: {
    fontSize: responsive(14),
    fontWeight: '600',
    color: '#ffffff',
  },

  rejectBtn: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: responsive(20),
    paddingVertical: responsive(11),
    alignItems: 'center',
    justifyContent: 'center',
  },

  rejectBtnText: {
    fontSize: responsive(14),
    fontWeight: '600',
    color: '#374151',
  },

  managePlayerList: {
    gap: responsive(10),
    marginTop: responsive(16),
  },

  managePlayerCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: responsive(12),
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: responsive(12),
  },

  managePlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsive(10),
  },

  manageAvatar: {
    width: responsive(40),
    height: responsive(40),
    borderRadius: responsive(20),
    alignItems: 'center',
    justifyContent: 'center',
  },

  manageAvatarText: {
    fontSize: responsive(16),
    fontWeight: '800',
    color: '#ffffff',
  },

  managePlayerInfo: {
    flex: 1,
    marginLeft: responsive(10),
  },

  manageActions: {
    flexDirection: 'row',
    gap: responsive(8),
  },

  manageEditBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: responsive(8),
    paddingVertical: responsive(8),
    alignItems: 'center',
  },

  manageEditText: {
    fontSize: responsive(12),
    fontWeight: '600',
    color: '#ffffff',
  },

  manageStatsBtn: {
    flex: 1,
    backgroundColor: '#06B6D4',
    borderRadius: responsive(8),
    paddingVertical: responsive(8),
    alignItems: 'center',
  },

  manageStatsText: {
    fontSize: responsive(12),
    fontWeight: '600',
    color: '#ffffff',
  },

  emptyModal: {
    alignItems: 'center',
    paddingVertical: responsive(40),
    gap: responsive(12),
  },

  emptyModalText: {
    fontSize: responsive(15),
    color: '#6B7280',
  },
});