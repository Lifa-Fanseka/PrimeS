import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 390;
const responsive = (size) => Math.round(size * Math.min(Math.max(scale, 0.85), 1.18));

const COLORS = {
  cyan: '#06B6D4',
  cyanDark: '#0891B2',
  blue: '#3B82F6',
  blueDark: '#1D4ED8',
  black: '#000000',
  white: '#FFFFFF',
  bg: '#F8F9FA',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  green: '#22C55E',
  red: '#EF4444',
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

// A match counts as "past" purely by date — once its playing date has
// gone by it moves out of Upcoming and into Previous Matches, whether or
// not the coach has entered a result for it yet.
function isPastDate(dateString) {
  if (!dateString) return false;
  const matchDate = new Date(dateString);
  if (Number.isNaN(matchDate.getTime())) return false;

  const today = new Date();
  matchDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return matchDate < today;
}

function resultBadgeStyle(result) {
  if (result === 'Win') return { bg: '#DCFCE7', fg: COLORS.green, letter: 'W' };
  if (result === 'Loss') return { bg: '#FEE2E2', fg: COLORS.red, letter: 'L' };
  if (result === 'Draw') return { bg: COLORS.gray100, fg: COLORS.gray600, letter: 'D' };
  return { bg: COLORS.gray100, fg: COLORS.gray500, letter: '—' };
}

export default function MyTeamScreen({ navigation }) {
  const [myAthleteId, setMyAthleteId] = useState(null);
  const [team, setTeam] = useState(null);
  const [coach, setCoach] = useState(null);
  const [squad, setSquad] = useState([]);
  const [matches, setMatches] = useState([]);
  const [upcomingMatch, setUpcomingMatch] = useState(null);
  const [showAllSquad, setShowAllSquad] = useState(false);
  const [showAllPrevious, setShowAllPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [profileRes, teamRes, squadRes, matchesRes] = await Promise.all([
        api.get('/api/Athlete/GetProfile'),
        api.get('/api/Team/GetAthleteteam'),
        api.get('/api/Team/GetMySquad'),
        api.get('/api/Match/GetAthleteTeamMatches'),
      ]);

      setMyAthleteId(profileRes.data.athleteId);
      setTeam(teamRes.data);
      setSquad(squadRes.data);

      if (teamRes.data.coachId) {
        try {
          const coachRes = await api.get(`/api/Coach/GetCoachById/${teamRes.data.coachId}`);
          setCoach(coachRes.data);
        } catch (err) {
          console.error('Failed to load coach:', err);
        }
      }

      setMatches(matchesRes.data);

      // Upcoming = earliest match whose date hasn't passed yet. A match
      // with a passed date never counts as "upcoming" even without a
      // result recorded — it belongs in Previous Matches instead.
      const upcoming = matchesRes.data
        .filter((m) => !isPastDate(m.matchDate))
        .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate))[0];
      setUpcomingMatch(upcoming ?? null);
    } catch (err) {
      console.error('Failed to load team:', err);
      Alert.alert('Error', 'Could not load your team.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleLeaveTeam = () => {
    Alert.alert('Leave Team', `Are you sure you want to leave ${team?.teamName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setLeaving(true);
          try {
            await api.delete('/api/Team/LeaveTeam');
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err?.response?.data ?? 'Could not leave the team.');
          } finally {
            setLeaving(false);
          }
        },
      },
    ]);
  };

  if (loading || !team) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
      </SafeAreaView>
    );
  }

  const visibleSquad = showAllSquad ? squad : squad.slice(0, 5);

  const previousMatches = matches
    .filter((m) => isPastDate(m.matchDate))
    .sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate));
  const visiblePreviousMatches = showAllPrevious ? previousMatches : previousMatches.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.75} style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Team</Text>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.headerButton}
          onPress={() => Alert.alert('Coming Soon', 'Sharing your team is not available yet.')}
        >
          <Feather name="share-2" size={20} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[COLORS.cyanDark, COLORS.blueDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeText}>{getInitials(team.teamName)}</Text>
          </View>

          <Text style={styles.bannerTeamName}>{team.teamName}</Text>

          <View style={styles.joinedPill}>
            <Feather name="check" size={12} color={COLORS.white} />
            <Text style={styles.joinedPillText}>Joined</Text>
          </View>
        </LinearGradient>

        <View style={styles.statStrip}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{squad.length}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{matches.length}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
        </View>

        {coach && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Head Coach</Text>

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.coachCard}
              onPress={() => navigation.navigate('PublicProfile', { type: 'Coach', id: team.coachId })}
            >
              {coach.profilePhoto ? (
                <Image source={{ uri: coach.profilePhoto }} style={styles.coachAvatar} />
              ) : (
                <View style={[styles.coachAvatar, { backgroundColor: getAvatarColor(coach.name), alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={styles.coachInitials}>{getInitials(coach.name)}</Text>
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.coachName}>{coach.name}</Text>
                <Text style={styles.coachTitle}>{coach.affiliation || 'Coach'}</Text>
              </View>

              <View style={styles.coachArrow}>
                <Feather name="arrow-right" size={16} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.squadHeaderRow}>
            <Text style={styles.sectionLabel}>Squad ({squad.length})</Text>

            {squad.length > 5 && (
              <TouchableOpacity activeOpacity={0.75} onPress={() => setShowAllSquad(!showAllSquad)}>
                <Text style={styles.seeAllText}>{showAllSquad ? 'Show less' : 'See all'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {visibleSquad.map((player) => {
            const isMe = player.athleteId === myAthleteId;

            return (
              <TouchableOpacity
                key={player.athleteId}
                activeOpacity={0.75}
                style={[styles.playerRow, isMe && styles.playerRowMe]}
                onPress={() => navigation.navigate('PublicProfile', { type: 'Athlete', id: player.athleteId })}
              >
                {player.profilePhoto ? (
                  <Image source={{ uri: player.profilePhoto }} style={styles.playerAvatar} />
                ) : (
                  <View style={[styles.playerAvatar, { backgroundColor: getAvatarColor(player.name), alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={styles.playerInitials}>{getInitials(player.name)}</Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <View style={styles.playerNameRow}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    {player.verified && <Feather name="check-circle" size={14} color={COLORS.cyan} />}
                    {isMe && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>YOU</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.playerPosition}>{player.position ?? '—'}</Text>
                </View>

                {player.jerseyNumber != null && (
                  <View style={styles.jerseyBadge}>
                    <Text style={styles.jerseyText}>{player.jerseyNumber}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {upcomingMatch && (
          <View style={styles.fixtureCard}>
            <Text style={styles.fixtureLabel}>Upcoming Fixture</Text>
            <Text style={styles.fixtureOpponent}>vs {upcomingMatch.opponentTeam ?? 'Unknown'}</Text>

            <View style={styles.fixtureMetaRow}>
              <Feather name="calendar" size={13} color={COLORS.gray500} />
              <Text style={styles.fixtureMetaText}>{formatDate(upcomingMatch.matchDate)}</Text>

              {upcomingMatch.matchLocation ? (
                <>
                  <Feather name="map-pin" size={13} color={COLORS.gray500} style={{ marginLeft: responsive(10) }} />
                  <Text style={styles.fixtureMetaText}>{upcomingMatch.matchLocation}</Text>
                </>
              ) : null}
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.getReadyButton}
              onPress={() => Alert.alert('Coming Soon', "Match prep details aren't built yet.")}
            >
              <Text style={styles.getReadyButtonText}>Get Ready</Text>
            </TouchableOpacity>
          </View>
        )}

        {previousMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.squadHeaderRow}>
              <Text style={styles.sectionLabel}>Previous Matches ({previousMatches.length})</Text>

              {previousMatches.length > 5 && (
                <TouchableOpacity activeOpacity={0.75} onPress={() => setShowAllPrevious(!showAllPrevious)}>
                  <Text style={styles.seeAllText}>{showAllPrevious ? 'Show less' : 'See all'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {visiblePreviousMatches.map((match) => {
              const badge = resultBadgeStyle(match.result);
              const hasScore = match.yourScore != null && match.opponentScore != null;

              return (
                <View key={match.matchId} style={styles.previousMatchRow}>
                  <View style={[styles.resultBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.resultBadgeText, { color: badge.fg }]}>{badge.letter}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.previousMatchOpponent}>vs {match.opponentTeam ?? 'Unknown'}</Text>
                    <Text style={styles.previousMatchMeta}>
                      {formatDate(match.matchDate)}
                      {match.matchType ? `  •  ${match.matchType}` : ''}
                    </Text>
                  </View>

                  {hasScore && (
                    <Text style={styles.previousMatchScore}>
                      {match.yourScore} - {match.opponentScore}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity activeOpacity={0.75} style={styles.leaveButton} onPress={handleLeaveTeam} disabled={leaving}>
          {leaving ? (
            <ActivityIndicator color={COLORS.red} size="small" />
          ) : (
            <Text style={styles.leaveButtonText}>Leave Team</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsive(16),
    paddingVertical: responsive(14),
  },

  headerButton: { width: responsive(36), height: responsive(36), alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: responsive(17), fontWeight: '700', color: COLORS.black },

  scrollContent: { paddingBottom: responsive(40) },

  banner: {
    marginHorizontal: responsive(16),
    borderRadius: responsive(18),
    padding: responsive(20),
    alignItems: 'center',
  },

  badgeBox: {
    width: responsive(56),
    height: responsive(56),
    borderRadius: responsive(14),
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsive(10),
  },

  badgeText: { color: COLORS.white, fontSize: responsive(20), fontWeight: '800' },
  bannerTeamName: { color: COLORS.white, fontSize: responsive(19), fontWeight: '800', marginBottom: responsive(10) },

  joinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(5),
    backgroundColor: COLORS.green,
    paddingHorizontal: responsive(12),
    paddingVertical: responsive(5),
    borderRadius: responsive(14),
  },

  joinedPillText: { color: COLORS.white, fontSize: responsive(12), fontWeight: '700' },

  statStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: responsive(16),
    marginTop: responsive(14),
    borderRadius: responsive(14),
    paddingVertical: responsive(16),
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },

  statCell: { flex: 1, alignItems: 'center', gap: responsive(4) },
  statDivider: { width: 1, backgroundColor: COLORS.gray200 },
  statValue: { fontSize: responsive(18), fontWeight: '800', color: COLORS.black },
  statLabel: { fontSize: responsive(11), color: COLORS.gray500 },

  section: { paddingHorizontal: responsive(16), marginTop: responsive(24) },
  sectionLabel: { fontSize: responsive(15), fontWeight: '800', color: COLORS.black, marginBottom: responsive(12) },

  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(12),
    backgroundColor: COLORS.white,
    borderRadius: responsive(14),
    padding: responsive(14),
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },

  coachAvatar: { width: responsive(48), height: responsive(48), borderRadius: responsive(24) },
  coachInitials: { color: COLORS.white, fontWeight: '700', fontSize: responsive(17) },
  coachName: { fontSize: responsive(15), fontWeight: '700', color: COLORS.black },
  coachTitle: { fontSize: responsive(13), color: COLORS.gray500, marginTop: responsive(2) },

  coachArrow: {
    width: responsive(32),
    height: responsive(32),
    borderRadius: responsive(16),
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },

  squadHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAllText: { fontSize: responsive(13), color: COLORS.cyan, fontWeight: '700' },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(12),
    backgroundColor: COLORS.white,
    borderRadius: responsive(12),
    padding: responsive(12),
    marginBottom: responsive(8),
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },

  playerRowMe: { backgroundColor: '#ECFEFF', borderColor: '#CFFAFE' },

  playerAvatar: { width: responsive(44), height: responsive(44), borderRadius: responsive(22) },
  playerInitials: { color: COLORS.white, fontWeight: '700', fontSize: responsive(15) },

  playerNameRow: { flexDirection: 'row', alignItems: 'center', gap: responsive(6) },
  playerName: { fontSize: responsive(14), fontWeight: '700', color: COLORS.black },
  playerPosition: { fontSize: responsive(12), color: COLORS.gray500, marginTop: responsive(2) },

  youBadge: { backgroundColor: COLORS.cyan, paddingHorizontal: responsive(6), paddingVertical: responsive(2), borderRadius: responsive(6) },
  youBadgeText: { color: COLORS.white, fontSize: responsive(9), fontWeight: '800' },

  jerseyBadge: {
    width: responsive(28),
    height: responsive(28),
    borderRadius: responsive(14),
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  jerseyText: { fontSize: responsive(12), fontWeight: '800', color: COLORS.gray700 },

  fixtureCard: {
    marginHorizontal: responsive(16),
    marginTop: responsive(24),
    backgroundColor: COLORS.white,
    borderRadius: responsive(14),
    padding: responsive(16),
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },

  fixtureLabel: { fontSize: responsive(11), fontWeight: '700', color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5 },
  fixtureOpponent: { fontSize: responsive(17), fontWeight: '800', color: COLORS.black, marginTop: responsive(6) },

  fixtureMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: responsive(8) },
  fixtureMetaText: { fontSize: responsive(12), color: COLORS.gray500, marginLeft: responsive(4) },

  getReadyButton: {
    marginTop: responsive(14),
    height: responsive(42),
    backgroundColor: COLORS.cyan,
    borderRadius: responsive(21),
    alignItems: 'center',
    justifyContent: 'center',
  },

  getReadyButtonText: { color: COLORS.white, fontSize: responsive(13), fontWeight: '700' },

  leaveButton: { alignItems: 'center', marginTop: responsive(28), paddingVertical: responsive(10) },
  leaveButtonText: { color: COLORS.red, fontSize: responsive(14), fontWeight: '600' },

  previousMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(12),
    backgroundColor: COLORS.white,
    borderRadius: responsive(12),
    padding: responsive(12),
    marginBottom: responsive(8),
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },

  resultBadge: {
    width: responsive(30),
    height: responsive(30),
    borderRadius: responsive(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBadgeText: { fontSize: responsive(13), fontWeight: '800' },

  previousMatchOpponent: { fontSize: responsive(14), fontWeight: '700', color: COLORS.black },
  previousMatchMeta: { fontSize: responsive(12), color: COLORS.gray500, marginTop: responsive(2) },
  previousMatchScore: { fontSize: responsive(14), fontWeight: '800', color: COLORS.black },
});