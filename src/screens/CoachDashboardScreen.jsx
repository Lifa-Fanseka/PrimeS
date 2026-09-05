import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import api from '../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 390;
const responsive = size => Math.round(size * Math.min(scale, 1.18));
const MATCH_TYPES = ['League', 'Cup', 'Friendly', 'Tournament'];
const QUICK_ACTIONS = [
  { id: 'qa1', label: 'Upload Fixture', icon: 'add-circle-outline', modal: 'uploadFixture', gradientStart: '#06B6D4', gradientEnd: '#3B82F6' },
  { id: 'qa2', label: 'Match Result', icon: 'document-text-outline', modal: 'uploadResult', gradientStart: '#3B82F6', gradientEnd: '#0891B2' },
  { id: 'qa3', label: 'Verify Stats', icon: 'bar-chart-outline', modal: 'verifyStats', gradientStart: '#0891B2', gradientEnd: '#3B82F6' },
  { id: 'qa4', label: 'Verify Videos', icon: 'videocam-outline', modal: 'verifyHighlights', gradientStart: '#2563EB', gradientEnd: '#06B6D4' },
  { id: 'qa5', label: 'Join Competition', icon: 'trophy-outline', modal: 'joinCompetition', gradientStart: '#3B82F6', gradientEnd: '#06B6D4' },
  { id: 'qa6', label: 'Send Notification', icon: 'notifications-outline', modal: 'sendNotification', gradientStart: '#06B6D4', gradientEnd: '#2563EB' },
];
function DashboardStatCard({ icon, label, value, gradientStart, gradientEnd, iconColor }) {
  return (
    <LinearGradient colors={[gradientStart, gradientEnd]} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Ionicons name={icon} size={24} color={iconColor} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );
}
function QuickActionButton({ action, onPress }) {
  return (
    <TouchableOpacity style={styles.quickActionWrapper} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={[action.gradientStart, action.gradientEnd]} style={styles.quickAction} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={action.icon} size={28} color="#ffffff" />
        <Text style={styles.quickActionLabel}>{action.label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
function FixtureCard({ fixture }) {
  const isHome = true; // Venue distinction (Home/Away) isn't stored on the backend yet
  return (
    <View style={styles.fixtureCard}>
      <View style={styles.fixtureTopRow}>
        <Text style={styles.fixtureOpponent}>{fixture.opponentTeam ?? 'Unknown'}</Text>
        <View style={[styles.venueBadge, { backgroundColor: '#ECFEFF' }]}>
          <Text style={[styles.venueBadgeText, { color: '#0891B2' }]}>{fixture.matchType ?? '—'}</Text>
        </View>
      </View>
      <View style={styles.fixtureMeta}>
        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
        <Text style={styles.fixtureMetaText}>{fixture.matchDate ?? 'TBC'}</Text>
        {fixture.matchLocation ? (
          <>
            <Ionicons name="location-outline" size={14} color="#6B7280" style={styles.fixtureTimeIcon} />
            <Text style={styles.fixtureMetaText}>{fixture.matchLocation}</Text>
          </>
        ) : null}
      </View>
    </View>
  );
}
function PlayerCard({ player, hasPendingStats, onVerify, onRecommend }) {
  return (
    <View style={styles.playerCard}>
      <View style={styles.playerRow}>
        <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.playerAvatar}>
          <Text style={styles.playerAvatarText}>{(player.name || '?').charAt(0)}</Text>
        </LinearGradient>
        <View style={styles.playerInfo}>
          <View style={styles.playerNameRow}>
            <Text style={styles.playerName}>{player.name}</Text>
            {player.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#06B6D4" style={styles.verifiedIcon} />
            )}
            {hasPendingStats && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            )}
          </View>
          <Text style={styles.playerPosition}>{player.position ?? '—'}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#EAB308" />
            <Text style={styles.ratingText}>
              {player.averageRating != null ? player.averageRating.toFixed(1) : '—'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.playerActions}>
        {hasPendingStats && (
          <TouchableOpacity style={styles.verifyBtn} onPress={onVerify} activeOpacity={0.85}>
            <Text style={styles.verifyBtnText}>Verify Stats</Text>
          </TouchableOpacity>
        )}
        {player.recommended ? (
          <View style={styles.recommendedTag}>
            <Ionicons name="checkmark-circle" size={14} color="#2563EB" />
            <Text style={styles.recommendedTagText}>Recommended</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.recommendBtn} onPress={onRecommend} activeOpacity={0.85}>
            <Ionicons name="person-add-outline" size={14} color="#ffffff" />
            <Text style={styles.recommendBtnText}>Recommend</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
function ModalShell({ visible, title, onClose, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
function FormField({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, numberOfLines = 1, onSubmitEditing, error }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && styles.formTextArea, error && styles.formInputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={onSubmitEditing ? 'done' : 'default'}
      />
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}
export default function CoachDashboardScreen({ navigation: navProp }) {
  const navHook = useNavigation();
  const navigation = navProp || navHook;
  const [activeTab, setActiveTab] = useState('home');
  const [activeModal, setActiveModal] = useState(null);
  const [coachProfile, setCoachProfile] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [coachTeam, setCoachTeam] = useState(null);
  const [pendingStats, setPendingStats] = useState([]);
  const [pendingHighlights, setPendingHighlights] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resultMatchId, setResultMatchId] = useState(null);
  const [resultOurScore, setResultOurScore] = useState('');
  const [resultTheirScore, setResultTheirScore] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [resultSubmitting, setResultSubmitting] = useState(false);
  const [fixtureOpponent, setFixtureOpponent] = useState('');
  const [fixtureDate, setFixtureDate] = useState('');
  const [fixtureType, setFixtureType] = useState('League');
  const [fixtureLocation, setFixtureLocation] = useState('');
  const [fixtureSubmitting, setFixtureSubmitting] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState('AllPlayers');
  const [notifAthleteId, setNotifAthleteId] = useState(null);
  const [notifSubmitting, setNotifSubmitting] = useState(false);
  const [availableCompetitions, setAvailableCompetitions] = useState([]);
  const [joiningCompetitionId, setJoiningCompetitionId] = useState(null);
  const [leavingCompetitionId, setLeavingCompetitionId] = useState(null);
  const [competitionDetailModal, setCompetitionDetailModal] = useState(false);
  const [selectedCompetitionDetail, setSelectedCompetitionDetail] = useState(null);
  const [competitionFixtures, setCompetitionFixtures] = useState([]);
  const [competitionStandings, setCompetitionStandings] = useState([]);
  const [competitionDetailTab, setCompetitionDetailTab] = useState('fixtures');
  const [competitionDetailLoading, setCompetitionDetailLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamNameError, setNewTeamNameError] = useState('');
  const [teamSubmitting, setTeamSubmitting] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const goTo = (screen, params) => navigation.navigate(screen, params);
  const openModal = modal => setActiveModal(modal);
  const closeModal = () => setActiveModal(null);
  const loadAll = useCallback(async () => {
    try {
      const [profileRes, playersRes, statsRes, mediaRes, matchesRes] = await Promise.all([
        api.get('/api/Coach/GetCoachProfile'),
        api.get('/api/Coach/players'),
        api.get('/api/Statistics/GetAthleteStats/pending'),
        api.get('/api/Media/pending'),
        api.get('/api/Match/GetCoachmatches'),
      ]);
      setCoachProfile(profileRes.data);
      setTeamPlayers(playersRes.data);
      setPendingStats(statsRes.data);
      setPendingHighlights(mediaRes.data);
      setFixtures(matchesRes.data);

      try {
        const teamRes = await api.get('/api/Team/GetCoachTeam');
        setCoachTeam(teamRes.data);
      } catch {
        setCoachTeam(null);
      }

      try {
        const competitionsRes = await api.get('/api/Competition');
        setAvailableCompetitions(competitionsRes.data);
      } catch (err) {
        console.error('Failed to load competitions:', err);
      }
    } catch (err) {
      console.error('Failed to load coach dashboard:', err);
      Alert.alert('Error', 'Could not load your dashboard.');
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
  const handleTabPress = tab => {
    setActiveTab(tab);
    if (tab === 'discover') goTo('Search');
    if (tab === 'messages') goTo('Messages');
    if (tab === 'profile') goTo('Profile');
  };
  const handleVerifyStat = async (stat) => {
    try {
      await api.put(`/api/Statistics/VerifyAthleteStats/${stat.statId}`, { verified: true });
      Alert.alert('Verified', 'Player statistics have been verified successfully.');
      loadAll();
    } catch (err) {
      Alert.alert('Error', 'Could not verify this statistic.');
    }
  };
  const handleRecommendPlayer = (player) => {
    Alert.alert(
      'Recommend Player',
      `Recommend ${player.name} to scouts? This will be visible on their profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Recommend',
          onPress: async () => {
            try {
              await api.put(`/api/Coach/players/${player.athleteId}/recommend`);
              Alert.alert('Success', `${player.name} has been recommended to scouts.`);
              loadAll();
            } catch (err) {
              console.error('Failed to recommend player:', err);
              Alert.alert('Error', err?.response?.data ?? 'Could not recommend this player. Please try again.');
            }
          },
        },
      ]
    );
  };
  const handleApproveHighlight = async (highlightId) => {
    try {
      await api.put(`/api/Media/${highlightId}/verify`, { approve: true });
      Alert.alert('Approved', 'Highlight video has been approved and published.');
      loadAll();
    } catch (err) {
      Alert.alert('Error', 'Could not approve this video.');
    }
  };
  const handleRejectHighlight = async (highlightId) => {
    try {
      await api.put(`/api/Media/${highlightId}/verify`, { approve: false });
      Alert.alert('Rejected', 'Highlight video has been rejected.');
      loadAll();
    } catch (err) {
      Alert.alert('Error', 'Could not reject this video.');
    }
  };
  const openResultModal = () => {
    setResultMatchId(null);
    setResultOurScore('');
    setResultTheirScore('');
    setResultNotes('');
    openModal('uploadResult');
  };
  const handleSubmitResult = async () => {
    if (!resultMatchId) {
      Alert.alert('Error', 'Please select which match this result is for.');
      return;
    }
    if (!resultOurScore || !resultTheirScore) {
      Alert.alert('Error', 'Please enter both scores.');
      return;
    }
    setResultSubmitting(true);
    try {
      await api.put(`/api/Match/${resultMatchId}/UpdateMatchResult`, {
        yourScore: Number(resultOurScore),
        opponentScore: Number(resultTheirScore),
        matchNotes: resultNotes || null,
      });
      Alert.alert('Success', 'Match result submitted successfully!');
      closeModal();
      loadAll();
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not submit the result.');
    } finally {
      setResultSubmitting(false);
    }
  };
  const handleSubmitFixture = async () => {
    if (!fixtureOpponent.trim()) {
      Alert.alert('Error', 'Please enter opponent team name.');
      return;
    }
    if (!fixtureDate.trim()) {
      Alert.alert('Error', 'Please enter a match date (YYYY-MM-DD).');
      return;
    }
    setFixtureSubmitting(true);
    try {
      await api.post('/api/Match/CreateMatche', {
        matchDate: fixtureDate.trim(),
        opponentTeam: fixtureOpponent.trim(),
        matchType: fixtureType,
        matchLocation: fixtureLocation.trim() || null,
      });
      Alert.alert('Success', 'Fixture created successfully!');
      setFixtureOpponent('');
      setFixtureDate('');
      setFixtureType('League');
      setFixtureLocation('');
      closeModal();
      loadAll();
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not create the fixture.');
    } finally {
      setFixtureSubmitting(false);
    }
  };
  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      Alert.alert('Error', 'Please fill in title and message.');
      return;
    }
    if (notifTarget === 'SpecificPlayer' && !notifAthleteId) {
      Alert.alert('Error', 'Please select a player.');
      return;
    }
    setNotifSubmitting(true);
    try {
      await api.post('/api/Coach/notify', {
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        target: notifTarget,
        athleteId: notifTarget === 'SpecificPlayer' ? notifAthleteId : null,
      });
      Alert.alert('Sent', `Notification sent.`);
      setNotifTitle('');
      setNotifMessage('');
      setNotifTarget('AllPlayers');
      setNotifAthleteId(null);
      closeModal();
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not send the notification.');
    } finally {
      setNotifSubmitting(false);
    }
  };
  const handleJoinCompetition = (competition) => {
    Alert.alert(
      'Join Competition',
      `Enter "${competition.competitionName}" with your team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            setJoiningCompetitionId(competition.competitionId);
            try {
              await api.post(`/api/Competition/${competition.competitionId}/join`);
              setAvailableCompetitions((prev) =>
                prev.map((c) =>
                  c.competitionId === competition.competitionId ? { ...c, myTeamJoined: true } : c
                )
              );
              Alert.alert('Success', `Your team has joined "${competition.competitionName}"!`);
            } catch (err) {
              Alert.alert('Error', err?.response?.data ?? 'Could not join this competition.');
            } finally {
              setJoiningCompetitionId(null);
            }
          },
        },
      ]
    );
  };

  const handleLeaveCompetition = (competition) => {
    Alert.alert(
      'Leave Competition',
      `Remove your team from "${competition.competitionName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeavingCompetitionId(competition.competitionId);
            try {
              await api.delete(`/api/Competition/${competition.competitionId}/leave`);
              setAvailableCompetitions((prev) =>
                prev.map((c) =>
                  c.competitionId === competition.competitionId ? { ...c, myTeamJoined: false } : c
                )
              );
            } catch (err) {
              Alert.alert('Error', 'Could not leave this competition.');
            } finally {
              setLeavingCompetitionId(null);
            }
          },
        },
      ]
    );
  };
  const openCompetitionDetail = async (competition) => {
    setSelectedCompetitionDetail(competition);
    setCompetitionDetailTab('fixtures');
    setCompetitionDetailModal(true);
    setCompetitionDetailLoading(true);
    try {
      const [fixturesRes, standingsRes] = await Promise.all([
        api.get(`/api/Competition/${competition.competitionId}/fixtures`),
        api.get(`/api/Competition/${competition.competitionId}/standings`),
      ]);
      setCompetitionFixtures(fixturesRes.data);
      setCompetitionStandings(standingsRes.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load competition details.');
    } finally {
      setCompetitionDetailLoading(false);
    }
  };
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setNewTeamNameError('Please enter a team name.');
      return;
    }
    setNewTeamNameError('');
    setTeamSubmitting(true);
    try {
      const res = await api.post('/api/Team/AddTeam', { teamName: newTeamName.trim() });
      setCoachTeam(res.data);
      setNewTeamName('');
      loadAll();
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not create the team.');
    } finally {
      setTeamSubmitting(false);
    }
  };
  const handleDeleteTeam = () => {
    Alert.alert(
      'Delete Team',
      `Are you sure you want to delete "${coachTeam?.teamName}"? All players will be removed from the team.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingTeam(true);
            try {
              await api.delete('/api/Team/DeleteTeam');
              setCoachTeam(null);
              setTeamPlayers([]);
              closeModal();
            } catch (err) {
              Alert.alert('Error', err?.response?.data ?? 'Could not delete the team.');
            } finally {
              setDeletingTeam(false);
            }
          },
        },
      ]
    );
  };
  const handleCopyInviteCode = async () => {
    if (!coachTeam?.inviteCode) return;
    await Clipboard.setStringAsync(coachTeam.inviteCode);
    Alert.alert('Copied', 'Invite code copied — paste it into a message to share with your players.');
  };
  const playerHasPendingStats = (athleteId) => pendingStats.some((s) => s.athleteId === athleteId);
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PRIME SCOUT</Text>
          <Text style={styles.headerSubtitle}>Coach Dashboard</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => goTo('Search')} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleTabPress('messages')} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => goTo('Settings')} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroSection}>
          <LinearGradient colors={['#06B6D4', '#2563EB']} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.heroTextWrapper}>
              <Text style={styles.heroTitle}>Manage Your Team</Text>
              <Text style={styles.heroSubtitle}>
                Track athletes, verify stats, upload fixtures, and guide your squad toward new opportunities.
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
            <DashboardStatCard icon="people-outline" label="Players" value={String(teamPlayers.length)} gradientStart="#EFF6FF" gradientEnd="#DBEAFE" iconColor="#2563EB" />
            <DashboardStatCard icon="trophy-outline" label="Matches Won" value={String(coachProfile?.wins ?? 0)} gradientStart="#ECFEFF" gradientEnd="#CFFAFE" iconColor="#0891B2" />
            <DashboardStatCard icon="trending-up-outline" label="Rating" value={String(coachProfile?.rating ?? '—')} gradientStart="#EFF6FF" gradientEnd="#DBEAFE" iconColor="#2563EB" />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coach Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.slice(0, 2).map(action => (
              <QuickActionButton key={action.id} action={action} onPress={() => (action.modal === 'uploadResult' ? openResultModal() : openModal(action.modal))} />
            ))}
          </View>
          <View style={[styles.quickActionsGrid, styles.quickActionsSpacing]}>
            {QUICK_ACTIONS.slice(2, 4).map(action => (
              <QuickActionButton key={action.id} action={action} onPress={() => openModal(action.modal)} />
            ))}
          </View>
          <View style={[styles.quickActionsGrid, styles.quickActionsSpacing]}>
            {QUICK_ACTIONS.slice(4, 6).map(action => (
              <QuickActionButton key={action.id} action={action} onPress={() => openModal(action.modal)} />
            ))}
          </View>
          <TouchableOpacity style={styles.manageTeamBtnWrapper} onPress={() => openModal('manageTeam')} activeOpacity={0.85}>
            <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.manageTeamBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="people-outline" size={22} color="#ffffff" />
              <Text style={styles.manageTeamBtnText}>Manage Team / Athletes</Text>
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
          {fixtures.length === 0 ? (
            <Text style={styles.emptyModalText}>No fixtures yet.</Text>
          ) : (
            <View style={styles.fixtureList}>
              {fixtures.map(fixture => (
                <FixtureCard key={fixture.matchId} fixture={fixture} />
              ))}
            </View>
          )}
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Team Players</Text>
            <TouchableOpacity onPress={() => openModal('manageTeam')}>
              <Text style={styles.linkText}>Manage</Text>
            </TouchableOpacity>
          </View>
          {teamPlayers.length === 0 ? (
            <Text style={styles.emptyModalText}>No players on your team yet. Share your invite code.</Text>
          ) : (
            <View style={styles.playerList}>
              {teamPlayers.map(player => (
                <PlayerCard
                  key={player.athleteId}
                  player={player}
                  hasPendingStats={playerHasPendingStats(player.athleteId)}
                  onVerify={() => openModal('verifyStats')}
                  onRecommend={() => handleRecommendPlayer(player)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.bottomNav}>
        {[
          { tab: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
          { tab: 'discover', icon: 'search-outline', activeIcon: 'search', label: 'Discover' },
          { tab: 'messages', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses', label: 'Messages' },
          { tab: 'profile', icon: 'person-outline', activeIcon: 'person', label: 'Me' },
        ].map(item => (
          <TouchableOpacity key={item.tab} style={styles.navTab} onPress={() => handleTabPress(item.tab)} activeOpacity={0.7}>
            <View>
              <Ionicons name={activeTab === item.tab ? item.activeIcon : item.icon} size={24} color={activeTab === item.tab ? '#06B6D4' : '#6B7280'} />
            </View>
            <Text style={[styles.navLabel, activeTab === item.tab && styles.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ModalShell visible={activeModal === 'uploadResult'} title="Upload Match Result" onClose={closeModal}>
        <View style={styles.modalBody}>
          <Text style={styles.formLabel}>Select Match</Text>
          {fixtures.length === 0 ? (
            <Text style={styles.emptyModalText}>Create a fixture first.</Text>
          ) : (
            fixtures.map((m) => (
              <TouchableOpacity
                key={m.matchId}
                style={[styles.venueOption, resultMatchId === m.matchId && styles.venueOptionActive, { marginBottom: 8, alignItems: 'flex-start', paddingVertical: 10 }]}
                onPress={() => setResultMatchId(m.matchId)}
              >
                <Text style={[styles.venueOptionText, resultMatchId === m.matchId && styles.venueOptionTextActive]}>
                  vs {m.opponentTeam} ({m.matchType}) — {m.matchDate}
                  {m.result ? ` [${m.result} ${m.yourScore}-${m.opponentScore}]` : ''}
                </Text>
              </TouchableOpacity>
            ))
          )}
          <View style={styles.scoreRow}>
            <View style={styles.scoreInputBox}>
              <FormField label="Your Score" value={resultOurScore} onChangeText={setResultOurScore} placeholder="0" keyboardType="number-pad" />
            </View>
            <View style={styles.scoreDivider}>
              <Text style={styles.scoreDividerText}>vs</Text>
            </View>
            <View style={styles.scoreInputBox}>
              <FormField label="Opponent Score" value={resultTheirScore} onChangeText={setResultTheirScore} placeholder="0" keyboardType="number-pad" />
            </View>
          </View>
          <FormField label="Match Notes" value={resultNotes} onChangeText={setResultNotes} placeholder="Additional notes, highlights, observations..." multiline numberOfLines={4} />
          <TouchableOpacity style={[styles.submitBtn, resultSubmitting && { opacity: 0.7 }]} onPress={handleSubmitResult} disabled={resultSubmitting}>
            {resultSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Submit Match Result</Text>}
          </TouchableOpacity>
        </View>
      </ModalShell>
      <ModalShell visible={activeModal === 'uploadFixture'} title="Upload Fixture" onClose={closeModal}>
        <View style={styles.modalBody}>
          <FormField label="Opponent Team" value={fixtureOpponent} onChangeText={setFixtureOpponent} placeholder="Enter opponent name" />
          <FormField label="Match Date" value={fixtureDate} onChangeText={setFixtureDate} placeholder="YYYY-MM-DD" />
          <Text style={styles.formLabel}>Match Type</Text>
          <View style={styles.venueToggle}>
            {MATCH_TYPES.map(type => (
              <TouchableOpacity key={type} style={[styles.venueOption, fixtureType === type && styles.venueOptionActive]} onPress={() => setFixtureType(type)}>
                <Text style={[styles.venueOptionText, fixtureType === type && styles.venueOptionTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormField label="Location / Stadium" value={fixtureLocation} onChangeText={setFixtureLocation} placeholder="Stadium or field name" />
          <TouchableOpacity style={[styles.submitBtn, fixtureSubmitting && { opacity: 0.7 }]} onPress={handleSubmitFixture} disabled={fixtureSubmitting}>
            {fixtureSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Create Fixture</Text>}
          </TouchableOpacity>
        </View>
      </ModalShell>
      <ModalShell visible={activeModal === 'verifyStats'} title="Verify Player Statistics" onClose={closeModal}>
        <View style={styles.modalBody}>
          {pendingStats.length === 0 ? (
            <View style={styles.emptyModal}>
              <Ionicons name="checkmark-circle" size={52} color="#06B6D4" />
              <Text style={styles.emptyModalText}>No pending verifications</Text>
            </View>
          ) : (
            pendingStats.map(stat => {
              const player = teamPlayers.find((p) => p.athleteId === stat.athleteId);
              return (
                <View key={stat.statId} style={styles.verifyCard}>
                  <View style={styles.verifyCardHeader}>
                    <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.verifyAvatar}>
                      <Text style={styles.verifyAvatarText}>{(player?.name || '?').charAt(0)}</Text>
                    </LinearGradient>
                    <View style={styles.verifyPlayerInfo}>
                      <Text style={styles.playerName}>{player?.name ?? `Athlete #${stat.athleteId}`}</Text>
                      <Text style={styles.playerPosition}>vs {stat.opponentTeam} ({stat.matchType})</Text>
                    </View>
                  </View>
                  <View style={styles.verifyStatsBox}>
                    <Text style={styles.verifyStatText}>
                      <Text style={styles.boldText}>Goals: </Text>{stat.goals ?? 0}{'  '}
                      <Text style={styles.boldText}>Assists: </Text>{stat.assists ?? 0}
                    </Text>
                    <Text style={styles.verifyStatText}>
                      <Text style={styles.boldText}>Minutes: </Text>{stat.minutesPlayed ?? 0}{'  '}
                      <Text style={styles.boldText}>Rating: </Text>{stat.matchRating ?? '—'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.submitBtn} onPress={() => handleVerifyStat(stat)}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                    <Text style={styles.submitBtnText}>{'  '}Verify Statistics</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ModalShell>
      <ModalShell visible={activeModal === 'verifyHighlights'} title="Verify Highlight Videos" onClose={closeModal}>
        <View style={styles.modalBody}>
          {pendingHighlights.length === 0 ? (
            <View style={styles.emptyModal}>
              <Ionicons name="checkmark-circle" size={52} color="#06B6D4" />
              <Text style={styles.emptyModalText}>No pending highlights</Text>
            </View>
          ) : (
            pendingHighlights.map(highlight => (
              <View key={highlight.mediaId} style={styles.highlightCard}>
                <View style={styles.highlightCardTop}>
                  <View>
                    <Text style={styles.playerName}>{highlight.athleteName ?? 'Unknown'}</Text>
                    <Text style={styles.playerPosition}>{highlight.uploadDate?.slice(0, 10)}</Text>
                  </View>
                </View>
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="videocam-outline" size={40} color="#9CA3AF" />
                  <Text style={styles.videoPlaceholderText}>Tap to preview</Text>
                </View>
                <Text style={styles.highlightDesc}>{highlight.caption || 'No caption'}</Text>
                <View style={styles.highlightActions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveHighlight(highlight.mediaId)}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectHighlight(highlight.mediaId)}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ModalShell>
      <ModalShell visible={activeModal === 'manageTeam'} title={coachTeam ? coachTeam.teamName : 'Manage Team'} onClose={closeModal}>
        <View style={styles.modalBody}>
          {!coachTeam ? (
            <View style={styles.createTeamContainer}>
              <View style={styles.createTeamIllustration}>
                <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.createTeamIconCircle}>
                  <Ionicons name="people" size={40} color="#ffffff" />
                </LinearGradient>
              </View>

              <Text style={styles.createTeamSubtitle}>
                You don't have a team yet. Create one and share the join code with your players.
              </Text>

              <FormField
                label="Team Name"
                value={newTeamName}
                onChangeText={(text) => {
                  setNewTeamName(text);
                  if (newTeamNameError) setNewTeamNameError('');
                }}
                placeholder="e.g. Kaizer Chiefs Youth"
                onSubmitEditing={handleCreateTeam}
                error={newTeamNameError}
              />

              <TouchableOpacity activeOpacity={0.85} onPress={handleCreateTeam} disabled={teamSubmitting}>
                <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.createTeamBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {teamSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="add" size={20} color="#ffffff" />
                      <Text style={styles.createTeamBtnText}>Create Team</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <LinearGradient colors={['#06B6D4', '#2563EB']} style={styles.codeBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.codeBannerLabel}>TEAM JOIN CODE</Text>
                <View style={styles.codeRow}>
                  <View style={styles.codePill}>
                    <Text style={styles.codePillText}>{coachTeam.inviteCode}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyCodeBtn}
                    onPress={handleCopyInviteCode}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="copy-outline" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeHint}>Tap the icon to copy, then paste it into a message to your players</Text>
              </LinearGradient>

              <View style={styles.playerCountStrip}>
                <Ionicons name="people" size={20} color="#06B6D4" />
                <Text style={styles.playerCountValue}>{teamPlayers.length}</Text>
                <Text style={styles.playerCountLabel}>Players Joined</Text>
              </View>

              <Text style={[styles.formLabel, { marginTop: 20, marginBottom: 10 }]}>
                Players Who Joined ({teamPlayers.length})
              </Text>

              {teamPlayers.length === 0 ? (
                <View style={styles.emptyModal}>
                  <Ionicons name="people-outline" size={44} color="#D1D5DB" />
                  <Text style={styles.emptyModalText}>No players yet. Share the code to invite athletes.</Text>
                </View>
              ) : (
                <View style={styles.managePlayerList}>
                  {teamPlayers.map(player => (
                    <View key={player.athleteId} style={styles.joinedPlayerRow}>
                      <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.manageAvatar}>
                        <Text style={styles.manageAvatarText}>{(player.name || '?').charAt(0)}</Text>
                      </LinearGradient>
                      <View style={styles.managePlayerInfo}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <Text style={styles.playerPosition}>{player.position ?? '—'}</Text>
                      </View>
                      <View style={styles.joinedPlayerRating}>
                        <Ionicons name="star" size={14} color="#EAB308" />
                        <Text style={styles.joinedPlayerRatingText}>
                          {player.averageRating != null ? player.averageRating.toFixed(1) : '—'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.deleteTeamBtn}
                onPress={handleDeleteTeam}
                disabled={deletingTeam}
              >
                {deletingTeam ? (
                  <ActivityIndicator color="#EF4444" size="small" />
                ) : (
                  <Text style={styles.deleteTeamBtnText}>Delete Team</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ModalShell>
      <ModalShell visible={activeModal === 'joinCompetition'} title="Join a Competition" onClose={closeModal}>
        <View style={styles.modalBody}>
          <Text style={styles.emptyModalText}>
            Browse competitions created by League Admins and enter your team.
          </Text>

          {availableCompetitions.length === 0 ? (
            <View style={styles.emptyModal}>
              <Ionicons name="trophy-outline" size={44} color="#D1D5DB" />
              <Text style={styles.emptyModalText}>No competitions available yet.</Text>
            </View>
          ) : (
            availableCompetitions.map((comp) => (
              <View key={comp.competitionId} style={styles.competitionCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{comp.competitionName}</Text>
                  {comp.leagueAdminName ? (
                    <Text style={styles.playerPosition}>Hosted by {comp.leagueAdminName}</Text>
                  ) : null}
                  {comp.startDate ? <Text style={styles.playerPosition}>{comp.startDate}</Text> : null}
                  {comp.venue ? <Text style={styles.playerPosition}>{comp.venue}</Text> : null}
                </View>

                {comp.myTeamJoined ? (
                  <View style={{ gap: 6 }}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={styles.verifyBtn}
                      onPress={() => openCompetitionDetail(comp)}
                    >
                      <Text style={styles.verifyBtnText}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={styles.rejectBtn}
                      onPress={() => handleLeaveCompetition(comp)}
                      disabled={leavingCompetitionId === comp.competitionId}
                    >
                      {leavingCompetitionId === comp.competitionId ? (
                        <ActivityIndicator color="#374151" size="small" />
                      ) : (
                        <Text style={styles.rejectBtnText}>Leave</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={styles.verifyBtn}
                    onPress={() => handleJoinCompetition(comp)}
                    disabled={joiningCompetitionId === comp.competitionId}
                  >
                    {joiningCompetitionId === comp.competitionId ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.verifyBtnText}>Join</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ModalShell>
      <Modal visible={competitionDetailModal} animationType="slide" transparent onRequestClose={() => setCompetitionDetailModal(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCompetitionDetail?.competitionName ?? 'Competition'}</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setCompetitionDetailModal(false)}>
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                {competitionDetailLoading ? (
                  <ActivityIndicator size="large" color="#06B6D4" style={{ marginVertical: 24 }} />
                ) : (
                  <>
                    <View style={styles.detailTabsRow}>
                      {['fixtures', 'standings'].map((tab) => (
                        <TouchableOpacity
                          key={tab}
                          style={[styles.detailTab, competitionDetailTab === tab && styles.detailTabActive]}
                          onPress={() => setCompetitionDetailTab(tab)}
                        >
                          <Text style={[styles.detailTabText, competitionDetailTab === tab && styles.detailTabTextActive]}>
                            {tab === 'fixtures' ? 'Fixtures' : 'Standings'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {competitionDetailTab === 'fixtures' && (
                      <View style={{ marginTop: 16 }}>
                        {competitionFixtures.length === 0 ? (
                          <Text style={styles.emptyModalText}>No fixtures scheduled yet.</Text>
                        ) : (
                          competitionFixtures.map((f) => (
                            <View key={f.matchId} style={styles.fixtureResultCard}>
                              <View style={styles.fixtureTeamsRow}>
                                <Text style={styles.fixtureTeamName} numberOfLines={1}>{f.homeTeamName}</Text>
                                <Text style={styles.fixtureScore}>
                                  {f.fixtureStatus === 'Completed' ? `${f.homeScore} - ${f.awayScore}` : 'vs'}
                                </Text>
                                <Text style={[styles.fixtureTeamName, { textAlign: 'right' }]} numberOfLines={1}>{f.awayTeamName}</Text>
                              </View>
                              <Text style={styles.fixtureDateText}>{f.matchDate || 'Date TBC'} • {f.fixtureStatus}</Text>
                            </View>
                          ))
                        )}
                      </View>
                    )}

                    {competitionDetailTab === 'standings' && (
                      <View style={{ marginTop: 16 }}>
                        {competitionStandings.length === 0 ? (
                          <Text style={styles.emptyModalText}>No standings yet.</Text>
                        ) : (
                          <View>
                            <View style={styles.standingsHeaderRow}>
                              <Text style={[styles.standingsHeaderCell, { flex: 2, textAlign: 'left' }]}>Team</Text>
                              <Text style={styles.standingsHeaderCell}>P</Text>
                              <Text style={styles.standingsHeaderCell}>W</Text>
                              <Text style={styles.standingsHeaderCell}>D</Text>
                              <Text style={styles.standingsHeaderCell}>L</Text>
                              <Text style={styles.standingsHeaderCell}>GD</Text>
                              <Text style={styles.standingsHeaderCell}>Pts</Text>
                            </View>
                            {competitionStandings.map((row, index) => (
                              <View key={row.teamId} style={styles.standingsRow}>
                                <Text style={[styles.standingsCell, { flex: 2, textAlign: 'left', fontWeight: '700' }]} numberOfLines={1}>
                                  {index + 1}. {row.teamName}
                                </Text>
                                <Text style={styles.standingsCell}>{row.played}</Text>
                                <Text style={styles.standingsCell}>{row.won}</Text>
                                <Text style={styles.standingsCell}>{row.drawn}</Text>
                                <Text style={styles.standingsCell}>{row.lost}</Text>
                                <Text style={styles.standingsCell}>{row.goalDifference}</Text>
                                <Text style={[styles.standingsCell, { fontWeight: '800', color: '#06B6D4' }]}>{row.points}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <ModalShell visible={activeModal === 'sendNotification'} title="Send Notification" onClose={closeModal}>
        <View style={styles.modalBody}>
          <Text style={styles.formLabel}>Send To</Text>
          <View style={styles.targetRow}>
            {[
              { key: 'AllPlayers', label: 'All Players' },
              { key: 'SpecificPlayer', label: 'Specific Player' },
              { key: 'Parents', label: 'Parents' },
            ].map(target => (
              <TouchableOpacity
                key={target.key}
                style={[styles.targetChip, notifTarget === target.key && styles.targetChipActive]}
                onPress={() => setNotifTarget(target.key)}
              >
                <Text style={[styles.targetChipText, notifTarget === target.key && styles.targetChipTextActive]}>
                  {target.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {notifTarget === 'SpecificPlayer' && (
            <View style={{ marginBottom: 12 }}>
              {teamPlayers.map((p) => (
                <TouchableOpacity
                  key={p.athleteId}
                  style={[styles.venueOption, notifAthleteId === p.athleteId && styles.venueOptionActive, { marginBottom: 6 }]}
                  onPress={() => setNotifAthleteId(p.athleteId)}
                >
                  <Text style={[styles.venueOptionText, notifAthleteId === p.athleteId && styles.venueOptionTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <FormField label="Notification Title" value={notifTitle} onChangeText={setNotifTitle} placeholder="e.g. Training tomorrow cancelled" />
          <FormField label="Message" value={notifMessage} onChangeText={setNotifMessage} placeholder="Write your message here..." multiline numberOfLines={5} />
          <TouchableOpacity style={[styles.submitBtn, notifSubmitting && { opacity: 0.7 }]} onPress={handleSendNotification} disabled={notifSubmitting}>
            {notifSubmitting ? <ActivityIndicator color="#ffffff" /> : (
              <>
                <Ionicons name="send-outline" size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}> Send Notification</Text>
              </>
            )}
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
  formInputError: {
    borderColor: '#EF4444',
  },
  fieldErrorText: {
    fontSize: responsive(12),
    color: '#EF4444',
    marginTop: responsive(6),
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
    marginTop: responsive(4),
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
    textAlign: 'center',
  },
  createTeamContainer: {
    alignItems: 'center',
    paddingTop: responsive(8),
  },
  createTeamIllustration: {
    marginBottom: responsive(20),
  },
  createTeamIconCircle: {
    width: responsive(88),
    height: responsive(88),
    borderRadius: responsive(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTeamSubtitle: {
    fontSize: responsive(14),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: responsive(20),
    marginBottom: responsive(24),
    paddingHorizontal: responsive(8),
  },
  createTeamBtn: {
    width: '100%',
    height: responsive(52),
    borderRadius: responsive(26),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive(8),
    marginTop: responsive(4),
  },
  createTeamBtnText: {
    color: '#ffffff',
    fontSize: responsive(15),
    fontWeight: '700',
  },
  codeBanner: {
    borderRadius: responsive(16),
    paddingVertical: responsive(20),
    paddingHorizontal: responsive(16),
    alignItems: 'center',
  },
  codeBannerLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: responsive(11),
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: responsive(10),
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(10),
  },
  codePill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: responsive(14),
    paddingHorizontal: responsive(24),
    paddingVertical: responsive(10),
  },
  codePillText: {
    color: '#ffffff',
    fontSize: responsive(26),
    fontWeight: '800',
    letterSpacing: 2,
  },
  copyCodeBtn: {
    width: responsive(40),
    height: responsive(40),
    borderRadius: responsive(20),
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: responsive(11),
    marginTop: responsive(10),
    textAlign: 'center',
  },
  playerCountStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive(8),
    backgroundColor: '#F9FAFB',
    borderRadius: responsive(12),
    paddingVertical: responsive(14),
    marginTop: responsive(14),
  },
  playerCountValue: {
    fontSize: responsive(18),
    fontWeight: '800',
    color: '#000000',
  },
  playerCountLabel: {
    fontSize: responsive(13),
    color: '#6B7280',
  },
  joinedPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: responsive(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: responsive(12),
  },
  joinedPlayerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(4),
  },
  joinedPlayerRatingText: {
    fontSize: responsive(13),
    fontWeight: '700',
    color: '#000000',
  },
  deleteTeamBtn: {
    alignItems: 'center',
    paddingVertical: responsive(16),
    marginTop: responsive(20),
  },
  deleteTeamBtnText: {
    color: '#EF4444',
    fontSize: responsive(14),
    fontWeight: '600',
  },

  competitionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: responsive(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: responsive(14),
    marginBottom: responsive(10),
  },

  detailTabsRow: { flexDirection: 'row', gap: responsive(8) },
  detailTab: {
    flex: 1,
    paddingVertical: responsive(10),
    borderRadius: responsive(10),
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailTabActive: { backgroundColor: '#ECFEFF', borderColor: '#06B6D4' },
  detailTabText: { fontSize: responsive(13), fontWeight: '600', color: '#6B7280' },
  detailTabTextActive: { color: '#0891B2' },

  fixtureResultCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: responsive(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: responsive(12),
    marginBottom: responsive(8),
  },
  fixtureTeamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fixtureTeamName: { flex: 1, fontSize: responsive(13), fontWeight: '700', color: '#000000' },
  fixtureScore: { fontSize: responsive(14), fontWeight: '800', color: '#06B6D4', marginHorizontal: responsive(8) },
  fixtureDateText: { fontSize: responsive(12), color: '#6B7280', marginTop: responsive(6) },

  standingsHeaderRow: {
    flexDirection: 'row',
    paddingVertical: responsive(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  standingsHeaderCell: { flex: 1, fontSize: responsive(11), fontWeight: '700', color: '#6B7280', textAlign: 'center' },
  standingsRow: {
    flexDirection: 'row',
    paddingVertical: responsive(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  standingsCell: { flex: 1, fontSize: responsive(12), color: '#374151', textAlign: 'center' },
});