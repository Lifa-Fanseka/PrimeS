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
import api from '../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 390;
const responsive = (size) => Math.round(size * Math.min(Math.max(scale, 0.85), 1.18));

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

function FormField({ label, value, onChangeText, placeholder, error }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, error && styles.formInputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
      />
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

function CompetitionCard({ competition, onPress }) {
  return (
    <TouchableOpacity style={styles.competitionCard} onPress={onPress} activeOpacity={0.75}>
      <View style={{ flex: 1 }}>
        <Text style={styles.competitionName}>{competition.competitionName}</Text>
        <View style={styles.competitionMetaRow}>
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text style={styles.competitionMetaText}>{competition.teamsJoinedCount} teams joined</Text>
        </View>
        {competition.scheduleGenerated ? (
          <View style={styles.scheduleBadge}>
            <Text style={styles.scheduleBadgeText}>Schedule Generated</Text>
          </View>
        ) : (
          <View style={[styles.scheduleBadge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.scheduleBadgeText, { color: '#B45309' }]}>No Schedule Yet</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function LeagueAdminDashboard({ navigation: navProp }) {
  const navHook = useNavigation();
  const navigation = navProp || navHook;

  const [profile, setProfile] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [createModal, setCreateModal] = useState(false);
  const [compName, setCompName] = useState('');
  const [compDate, setCompDate] = useState('');
  const [compVenue, setCompVenue] = useState('');
  const [compNameError, setCompNameError] = useState('');
  const [creating, setCreating] = useState(false);

  const [detailModal, setDetailModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [joinedTeams, setJoinedTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [standings, setStandings] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [detailTab, setDetailTab] = useState('teams');

  const [resultModal, setResultModal] = useState(false);
  const [resultFixture, setResultFixture] = useState(null);
  const [homeScoreInput, setHomeScoreInput] = useState('');
  const [awayScoreInput, setAwayScoreInput] = useState('');
  const [savingResult, setSavingResult] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [profileRes, competitionsRes] = await Promise.all([
        api.get('/api/LeagueAdmin/me'),
        api.get('/api/LeagueAdmin/GetMyCompetitions'),
      ]);
      setProfile(profileRes.data);
      setCompetitions(competitionsRes.data);
    } catch (err) {
      console.error('Failed to load League Admin dashboard:', err);
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

  const handleCreateCompetition = async () => {
    if (!compName.trim()) {
      setCompNameError('Please enter a competition name.');
      return;
    }
    setCompNameError('');
    setCreating(true);
    try {
      const res = await api.post('/api/LeagueAdmin/CreateCompetition', {
        competitionName: compName.trim(),
        startDate: compDate.trim() || null,
        venue: compVenue.trim() || null,
      });
      setCompetitions((prev) => [res.data, ...prev]);
      setCompName('');
      setCompDate('');
      setCompVenue('');
      setCreateModal(false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not create the competition.');
    } finally {
      setCreating(false);
    }
  };

  const openDetail = async (competition) => {
    setSelectedCompetition(competition);
    setDetailTab('teams');
    setDetailModal(true);
    setDetailLoading(true);
    try {
      const [teamsRes, fixturesRes, standingsRes] = await Promise.all([
        api.get(`/api/LeagueAdmin/competitions/${competition.competitionId}/teams`),
        api.get(`/api/LeagueAdmin/competitions/${competition.competitionId}/fixtures`),
        api.get(`/api/LeagueAdmin/competitions/${competition.competitionId}/standings`),
      ]);
      setJoinedTeams(teamsRes.data);
      setFixtures(fixturesRes.data);
      setStandings(standingsRes.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load competition details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!selectedCompetition) return;
    try {
      const [fixturesRes, standingsRes] = await Promise.all([
        api.get(`/api/LeagueAdmin/competitions/${selectedCompetition.competitionId}/fixtures`),
        api.get(`/api/LeagueAdmin/competitions/${selectedCompetition.competitionId}/standings`),
      ]);
      setFixtures(fixturesRes.data);
      setStandings(standingsRes.data);
    } catch (err) {
      console.error('Failed to refresh detail:', err);
    }
  };

  const handleGenerateSchedule = () => {
    if (joinedTeams.length < 2) {
      Alert.alert('Not Enough Teams', 'At least 2 teams need to join before a schedule can be generated.');
      return;
    }
    Alert.alert(
      'Generate Schedule',
      `Generate a full round-robin schedule for ${joinedTeams.length} teams? This creates every fixture at once and can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setGeneratingSchedule(true);
            try {
              const res = await api.post(`/api/LeagueAdmin/competitions/${selectedCompetition.competitionId}/generate-schedule`);
              setFixtures(res.data);
              setCompetitions((prev) =>
                prev.map((c) =>
                  c.competitionId === selectedCompetition.competitionId ? { ...c, scheduleGenerated: true } : c
                )
              );
              setDetailTab('fixtures');
              Alert.alert('Schedule Generated', `${res.data.length} fixtures created.`);
            } catch (err) {
              Alert.alert('Error', err?.response?.data ?? 'Could not generate the schedule.');
            } finally {
              setGeneratingSchedule(false);
            }
          },
        },
      ]
    );
  };

  const openResultModal = (fixture) => {
    setResultFixture(fixture);
    setHomeScoreInput(fixture.homeScore != null ? String(fixture.homeScore) : '');
    setAwayScoreInput(fixture.awayScore != null ? String(fixture.awayScore) : '');
    setResultModal(true);
  };

  const handleSaveResult = async () => {
    if (homeScoreInput.trim() === '' || awayScoreInput.trim() === '') {
      Alert.alert('Missing Scores', 'Please enter both scores.');
      return;
    }
    setSavingResult(true);
    try {
      await api.put(`/api/LeagueAdmin/fixtures/${resultFixture.matchId}/result`, {
        homeScore: Number(homeScoreInput),
        awayScore: Number(awayScoreInput),
      });
      setResultModal(false);
      refreshDetail();
    } catch (err) {
      Alert.alert('Error', err?.response?.data ?? 'Could not save the result.');
    } finally {
      setSavingResult(false);
    }
  };

  const handleDeleteCompetition = (competition) => {
    Alert.alert('Delete Competition', `Delete "${competition.competitionName}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/LeagueAdmin/competitions/${competition.competitionId}`);
            setCompetitions((prev) => prev.filter((c) => c.competitionId !== competition.competitionId));
            setDetailModal(false);
          } catch (err) {
            Alert.alert('Error', 'Could not delete this competition.');
          }
        },
      },
    ]);
  };

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
          <Text style={styles.headerSubtitle}>League Admin Dashboard</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Messages')} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroSection}>
          <LinearGradient colors={['#06B6D4', '#2563EB']} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.heroTextWrapper}>
              <Text style={styles.heroTitle}>Manage Competitions</Text>
              <Text style={styles.heroSubtitle}>
                Create leagues, schedule fixtures, and keep standings accurate for every team that joins.
              </Text>
            </View>
            <View style={styles.heroIconCircle}>
              <Ionicons name="trophy-outline" size={32} color="#ffffff" />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.createBtnWrapper} onPress={() => setCreateModal(true)} activeOpacity={0.85}>
            <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.createBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="add-circle-outline" size={22} color="#ffffff" />
              <Text style={styles.createBtnText}>Create Competition</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Competitions ({competitions.length})</Text>
          {competitions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No competitions created yet.</Text>
              <Text style={styles.emptyStateSub}>Create one to start inviting teams.</Text>
            </View>
          ) : (
            <View style={{ gap: responsive(10) }}>
              {competitions.map((c) => (
                <CompetitionCard key={c.competitionId} competition={c} onPress={() => openDetail(c)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Platform.OS === 'ios' ? responsive(20) : responsive(8) }]}>
        <TouchableOpacity style={styles.navTab} onPress={() => {}} activeOpacity={0.7}>
          <Ionicons name="home" size={24} color="#06B6D4" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => navigation.navigate('Messages')} activeOpacity={0.7}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
          <Ionicons name="person-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Me</Text>
        </TouchableOpacity>
      </View>

      <ModalShell visible={createModal} title="Create Competition" onClose={() => setCreateModal(false)}>
        <View style={styles.modalBody}>
          <FormField
            label="Competition Name"
            value={compName}
            onChangeText={(t) => {
              setCompName(t);
              if (compNameError) setCompNameError('');
            }}
            placeholder="e.g. Regional Youth Cup 2026"
            error={compNameError}
          />
          <FormField label="Start Date" value={compDate} onChangeText={setCompDate} placeholder="YYYY-MM-DD, e.g. 2026-06-01" />
          <FormField label="Venue / Location" value={compVenue} onChangeText={setCompVenue} placeholder="e.g. Soccer City, Johannesburg" />
          <TouchableOpacity style={[styles.submitBtn, creating && { opacity: 0.7 }]} onPress={handleCreateCompetition} disabled={creating}>
            {creating ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Create Competition</Text>}
          </TouchableOpacity>
        </View>
      </ModalShell>

      <ModalShell
        visible={detailModal}
        title={selectedCompetition?.competitionName ?? 'Competition'}
        onClose={() => setDetailModal(false)}
      >
        <View style={styles.modalBody}>
          {detailLoading ? (
            <ActivityIndicator size="large" color="#06B6D4" style={{ marginVertical: 24 }} />
          ) : (
            <>
              <View style={styles.detailTabsRow}>
                {['teams', 'fixtures', 'standings'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.detailTab, detailTab === tab && styles.detailTabActive]}
                    onPress={() => setDetailTab(tab)}
                  >
                    <Text style={[styles.detailTabText, detailTab === tab && styles.detailTabTextActive]}>
                      {tab === 'teams' ? 'Teams' : tab === 'fixtures' ? 'Fixtures' : 'Standings'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {detailTab === 'teams' && (
                <View style={{ marginTop: responsive(16) }}>
                  {joinedTeams.length === 0 ? (
                    <Text style={styles.emptyModalText}>No teams have joined yet.</Text>
                  ) : (
                    joinedTeams.map((t) => (
                      <View key={t.teamId} style={styles.teamRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.teamName}>{t.teamName}</Text>
                          <Text style={styles.teamCoach}>Coach: {t.coachName}</Text>
                        </View>
                      </View>
                    ))
                  )}

                  {!selectedCompetition?.scheduleGenerated && (
                    <TouchableOpacity
                      style={[styles.submitBtn, { marginTop: responsive(20) }, generatingSchedule && { opacity: 0.7 }]}
                      onPress={handleGenerateSchedule}
                      disabled={generatingSchedule}
                    >
                      {generatingSchedule ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.submitBtnText}>Generate Round-Robin Schedule</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.deleteCompetitionBtn}
                    onPress={() => handleDeleteCompetition(selectedCompetition)}
                  >
                    <Text style={styles.deleteCompetitionBtnText}>Delete Competition</Text>
                  </TouchableOpacity>
                </View>
              )}

              {detailTab === 'fixtures' && (
                <View style={{ marginTop: responsive(16) }}>
                  {fixtures.length === 0 ? (
                    <Text style={styles.emptyModalText}>No fixtures yet. Generate a schedule from the Teams tab.</Text>
                  ) : (
                    fixtures.map((f) => (
                      <TouchableOpacity key={f.matchId} style={styles.fixtureCard} onPress={() => openResultModal(f)} activeOpacity={0.75}>
                        <View style={styles.fixtureTeamsRow}>
                          <Text style={styles.fixtureTeamName} numberOfLines={1}>{f.homeTeamName}</Text>
                          <Text style={styles.fixtureScore}>
                            {f.fixtureStatus === 'Completed' ? `${f.homeScore} - ${f.awayScore}` : 'vs'}
                          </Text>
                          <Text style={[styles.fixtureTeamName, { textAlign: 'right' }]} numberOfLines={1}>{f.awayTeamName}</Text>
                        </View>
                        <View style={styles.fixtureMetaRow}>
                          <Text style={styles.fixtureDate}>{f.matchDate || 'Date TBC'}</Text>
                          <View style={[styles.fixtureStatusBadge, f.fixtureStatus === 'Completed' && styles.fixtureStatusCompleted]}>
                            <Text style={[styles.fixtureStatusText, f.fixtureStatus === 'Completed' && styles.fixtureStatusTextCompleted]}>
                              {f.fixtureStatus}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {detailTab === 'standings' && (
                <View style={{ marginTop: responsive(16) }}>
                  {standings.length === 0 ? (
                    <Text style={styles.emptyModalText}>No standings yet — results will appear here once fixtures are completed.</Text>
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
                      {standings.map((row, index) => (
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
      </ModalShell>

      <ModalShell visible={resultModal} title="Enter Result" onClose={() => setResultModal(false)}>
        <View style={styles.modalBody}>
          {resultFixture && (
            <>
              <Text style={styles.resultMatchupText}>
                {resultFixture.homeTeamName} vs {resultFixture.awayTeamName}
              </Text>
              <View style={styles.scoreRow}>
                <View style={styles.scoreInputBox}>
                  <FormField label={resultFixture.homeTeamName} value={homeScoreInput} onChangeText={setHomeScoreInput} placeholder="0" />
                </View>
                <View style={styles.scoreDivider}>
                  <Text style={styles.scoreDividerText}>vs</Text>
                </View>
                <View style={styles.scoreInputBox}>
                  <FormField label={resultFixture.awayTeamName} value={awayScoreInput} onChangeText={setAwayScoreInput} placeholder="0" />
                </View>
              </View>
              <TouchableOpacity style={[styles.submitBtn, savingResult && { opacity: 0.7 }]} onPress={handleSaveResult} disabled={savingResult}>
                {savingResult ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Result</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ModalShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: responsive(24) },
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
  headerTitle: { fontSize: responsive(20), fontWeight: '800', color: '#000000' },
  headerSubtitle: { fontSize: responsive(12), color: '#6B7280', marginTop: 2 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: responsive(4) },
  iconBtn: { padding: responsive(8), borderRadius: responsive(8) },
  heroSection: { paddingHorizontal: responsive(16), paddingTop: responsive(16), paddingBottom: responsive(8) },
  heroCard: {
    borderRadius: responsive(20),
    padding: responsive(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextWrapper: { flex: 1, paddingRight: responsive(12) },
  heroTitle: { fontSize: responsive(22), fontWeight: '800', color: '#ffffff', marginBottom: responsive(6) },
  heroSubtitle: { fontSize: responsive(13), lineHeight: responsive(19), color: '#E0F2FE' },
  heroIconCircle: {
    width: responsive(58),
    height: responsive(58),
    borderRadius: responsive(29),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { paddingHorizontal: responsive(16), paddingTop: responsive(12) },
  sectionTitle: { fontSize: responsive(16), fontWeight: '700', color: '#000000', marginBottom: responsive(12) },
  createBtnWrapper: {},
  createBtn: {
    borderRadius: responsive(14),
    paddingVertical: responsive(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive(10),
  },
  createBtnText: { fontSize: responsive(15), fontWeight: '700', color: '#ffffff' },
  competitionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: responsive(14),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: responsive(14),
  },
  competitionName: { fontSize: responsive(15), fontWeight: '700', color: '#000000', marginBottom: responsive(4) },
  competitionMetaRow: { flexDirection: 'row', alignItems: 'center', gap: responsive(4), marginBottom: responsive(8) },
  competitionMetaText: { fontSize: responsive(12), color: '#6B7280' },
  scheduleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFEFF',
    borderRadius: responsive(10),
    paddingHorizontal: responsive(8),
    paddingVertical: responsive(3),
  },
  scheduleBadgeText: { fontSize: responsive(11), fontWeight: '600', color: '#0891B2' },
  emptyState: { alignItems: 'center', paddingVertical: responsive(40), gap: responsive(4) },
  emptyStateText: { fontSize: responsive(15), fontWeight: '600', color: '#374151', marginTop: responsive(8) },
  emptyStateSub: { fontSize: responsive(13), color: '#9CA3AF' },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: responsive(8),
    paddingHorizontal: responsive(8),
  },
  navTab: { flex: 1, alignItems: 'center', gap: responsive(4), paddingVertical: responsive(4) },
  navLabel: { fontSize: responsive(11), fontWeight: '500', color: '#6B7280' },
  navLabelActive: { color: '#06B6D4' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
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
  modalTitle: { fontSize: responsive(18), fontWeight: '700', color: '#000000', flex: 1 },
  modalCloseBtn: {
    width: responsive(32),
    height: responsive(32),
    borderRadius: responsive(16),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { padding: responsive(20) },
  formField: { marginBottom: responsive(14) },
  formLabel: { fontSize: responsive(14), fontWeight: '500', color: '#374151', marginBottom: responsive(6) },
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
  formInputError: { borderColor: '#EF4444' },
  fieldErrorText: { fontSize: responsive(12), color: '#EF4444', marginTop: responsive(6) },
  submitBtn: {
    backgroundColor: '#06B6D4',
    borderRadius: responsive(24),
    paddingVertical: responsive(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsive(8),
  },
  submitBtnText: { fontSize: responsive(15), fontWeight: '600', color: '#ffffff' },
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
  emptyModalText: { fontSize: responsive(14), color: '#6B7280', textAlign: 'center', paddingVertical: responsive(16) },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: responsive(10),
    padding: responsive(12),
    marginBottom: responsive(8),
  },
  teamName: { fontSize: responsive(14), fontWeight: '700', color: '#000000' },
  teamCoach: { fontSize: responsive(12), color: '#6B7280', marginTop: responsive(2) },
  deleteCompetitionBtn: { alignItems: 'center', paddingVertical: responsive(16), marginTop: responsive(8) },
  deleteCompetitionBtnText: { color: '#EF4444', fontSize: responsive(14), fontWeight: '600' },
  fixtureCard: {
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
  fixtureMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: responsive(8) },
  fixtureDate: { fontSize: responsive(12), color: '#6B7280' },
  fixtureStatusBadge: { backgroundColor: '#FEF3C7', borderRadius: responsive(8), paddingHorizontal: responsive(8), paddingVertical: responsive(2) },
  fixtureStatusCompleted: { backgroundColor: '#DCFCE7' },
  fixtureStatusText: { fontSize: responsive(11), fontWeight: '600', color: '#B45309' },
  fixtureStatusTextCompleted: { color: '#16A34A' },
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
  resultMatchupText: { fontSize: responsive(15), fontWeight: '700', color: '#000000', textAlign: 'center', marginBottom: responsive(16) },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: responsive(8) },
  scoreInputBox: { flex: 1 },
  scoreDivider: { paddingTop: responsive(24), alignItems: 'center' },
  scoreDividerText: { fontSize: responsive(13), fontWeight: '600', color: '#6B7280' },
});