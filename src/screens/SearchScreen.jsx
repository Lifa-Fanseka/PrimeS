import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ScrollView,
  Image,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  cyan: '#06B6D4',
  cyanDark: '#0891B2',
  cyanLight: '#ECFEFF',
  cyanBorder: '#CFFAFE',
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
  red: '#EF4444',
  yellow: '#FACC15',
};

const athletes = [
  {
    id: '1',
    name: 'Jordan Martinez',
    sport: 'Basketball',
    position: 'Point Guard',
    location: 'Los Angeles, California',
    image: 'https://images.unsplash.com/photo-1578479161055-9d2d985e2de0?w=400',
    coverImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1080',
    verified: true,
    goals: 34,
    assists: 18,
    matches: 52,
    rating: 8.7,
    age: 19,
    about: 'Experienced point guard with exceptional court vision and leadership skills. Three-time league champion.',
    team: 'Lakers Youth FC',
  },
  {
    id: '2',
    name: 'Alex Chen',
    sport: 'Track & Field',
    position: 'Sprinter',
    location: 'Chicago, Illinois',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
    coverImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1080',
    verified: true,
    goals: 28,
    assists: 12,
    matches: 45,
    rating: 8.9,
    age: 16,
    about: 'Elite sprinter specializing in 100m and 200m. Regional champion with nationally ranked personal bests.',
    team: 'Youth Academy FC',
  },
  {
    id: '3',
    name: 'Thabo Mkhize',
    sport: 'Football',
    position: 'Striker',
    location: 'Cape Town, South Africa',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1080',
    verified: true,
    goals: 42,
    assists: 15,
    matches: 38,
    rating: 9.2,
    age: 17,
    about: 'Dynamic striker with exceptional finishing ability. Top scorer in the regional league.',
    team: 'Cape Town United',
  },
];

const sports = ['All', 'Basketball', 'Football', 'Track & Field', 'Rugby', 'Cricket'];

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [savedAthletes, setSavedAthletes] = useState(new Set());
  const [focusedField, setFocusedField] = useState('');

  const [filters, setFilters] = useState({
    position: '',
    ageMin: '',
    ageMax: '',
    region: '',
    ratingMin: '',
  });

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleFilters = () => {
    LayoutAnimation.easeInEaseOut();
    setShowFilters(!showFilters);
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      position: '',
      ageMin: '',
      ageMax: '',
      region: '',
      ratingMin: '',
    });
  };

  const toggleSave = (id) => {
    setSavedAthletes((prev) => {
      const updated = new Set(prev);

      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }

      return updated;
    });
  };

  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        a.name.toLowerCase().includes(q) ||
        a.sport.toLowerCase().includes(q) ||
        a.position.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q);

      const matchesSport = selectedSport === 'All' || a.sport === selectedSport;

      const matchesPosition =
        !filters.position ||
        a.position.toLowerCase().includes(filters.position.toLowerCase());

      const matchesRegion =
        !filters.region ||
        a.location.toLowerCase().includes(filters.region.toLowerCase());

      const matchesRating =
        !filters.ratingMin || a.rating >= parseFloat(filters.ratingMin);

      const matchesAgeMin =
        !filters.ageMin || a.age >= parseInt(filters.ageMin, 10);

      const matchesAgeMax =
        !filters.ageMax || a.age <= parseInt(filters.ageMax, 10);

      return (
        matchesSearch &&
        matchesSport &&
        matchesPosition &&
        matchesRegion &&
        matchesRating &&
        matchesAgeMin &&
        matchesAgeMax
      );
    });
  }, [searchQuery, selectedSport, filters]);

  const renderAthlete = useCallback(
    ({ item }) => {
      const isSaved = savedAthletes.has(item.id);

      return (
        <View style={styles.athleteCard}>
          <View style={styles.imageSection}>
            <Image source={{ uri: item.coverImage }} style={styles.coverImage} />

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={styles.imageGradient}
            />

            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            )}

            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={14} color={COLORS.yellow} />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.nameRow}>
              <Text style={styles.athleteName}>{item.name}</Text>

              {item.verified && (
                <Feather name="check-circle" size={18} color={COLORS.cyan} />
              )}
            </View>

            <Text style={styles.sportText}>{item.sport}</Text>
            <Text style={styles.positionText}>
              {item.position} • {item.location}
            </Text>

            <View style={styles.statsRow}>
              <StatChip label="Goals" value={item.goals} />
              <StatChip label="Assists" value={item.assists} />
              <StatChip label="Matches" value={item.matches} />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.viewProfileButton}
                onPress={() => navigation.navigate('AthleteProfile', { athlete: item })}
              >
                <Text style={styles.viewProfileText}>View Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.circleButton}
                onPress={() => navigation.navigate('Messages', { athleteName: item.name })}
              >
                <Feather name="mail" size={18} color={COLORS.gray600} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.circleButton}
                onPress={() => toggleSave(item.id)}
              >
                <MaterialCommunityIcons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={isSaved ? COLORS.cyan : COLORS.gray600}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [savedAthletes, navigation]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View style={styles.backRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="chevron-left" size={22} color={COLORS.gray700} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Search Athletes</Text>
          </View>

          <View style={styles.searchWrapper}>
            <Feather
              name="search"
              size={20}
              color={COLORS.gray400}
              style={styles.searchIcon}
            />

            <TextInput
              style={[
                styles.searchInput,
                focusedField === 'search' && styles.inputFocused,
              ]}
              placeholder="Search athletes..."
              placeholderTextColor={COLORS.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setFocusedField('search')}
              onBlur={() => setFocusedField('')}
            />

            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.filterButton,
                showFilters && { backgroundColor: COLORS.cyanDark },
              ]}
              onPress={toggleFilters}
            >
              <Feather name="sliders" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            {sports.map((sport) => {
              const active = sport === selectedSport;

              return (
                <TouchableOpacity
                  key={sport}
                  activeOpacity={0.75}
                  style={[styles.sportChip, active && styles.sportChipActive]}
                  onPress={() => setSelectedSport(sport)}
                >
                  <Text
                    style={[
                      styles.sportChipText,
                      active && styles.sportChipTextActive,
                    ]}
                  >
                    {sport}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {showFilters && (
            <View style={styles.filtersPanel}>
              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>Advanced Filters</Text>

                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.closeFilterButton}
                  onPress={toggleFilters}
                >
                  <Feather name="x" size={16} color={COLORS.gray600} />
                </TouchableOpacity>
              </View>

              <FilterInput
                label="Position"
                placeholder="e.g., Point Guard, Striker"
                value={filters.position}
                onChangeText={(text) => updateFilter('position', text)}
                focused={focusedField === 'position'}
                onFocus={() => setFocusedField('position')}
                onBlur={() => setFocusedField('')}
              />

              <Text style={styles.filterLabel}>Age Range</Text>

              <View style={styles.ageRow}>
                <TextInput
                  style={[
                    styles.filterInput,
                    focusedField === 'ageMin' && styles.filterInputFocused,
                    styles.ageInput,
                  ]}
                  placeholder="Min Age"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  value={filters.ageMin}
                  onChangeText={(text) => updateFilter('ageMin', text)}
                  onFocus={() => setFocusedField('ageMin')}
                  onBlur={() => setFocusedField('')}
                />

                <TextInput
                  style={[
                    styles.filterInput,
                    focusedField === 'ageMax' && styles.filterInputFocused,
                    styles.ageInput,
                  ]}
                  placeholder="Max Age"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  value={filters.ageMax}
                  onChangeText={(text) => updateFilter('ageMax', text)}
                  onFocus={() => setFocusedField('ageMax')}
                  onBlur={() => setFocusedField('')}
                />
              </View>

              <FilterInput
                label="Region"
                placeholder="e.g., Cape Town, Johannesburg"
                value={filters.region}
                onChangeText={(text) => updateFilter('region', text)}
                focused={focusedField === 'region'}
                onFocus={() => setFocusedField('region')}
                onBlur={() => setFocusedField('')}
              />

              <FilterInput
                label="Minimum Rating"
                placeholder="8.0"
                value={filters.ratingMin}
                onChangeText={(text) => updateFilter('ratingMin', text)}
                focused={focusedField === 'ratingMin'}
                onFocus={() => setFocusedField('ratingMin')}
                onBlur={() => setFocusedField('')}
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <FlatList
          data={filteredAthletes}
          renderItem={renderAthlete}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FilterInput({
  label,
  placeholder,
  value,
  onChangeText,
  focused,
  onFocus,
  onBlur,
  keyboardType = 'default',
}) {
  return (
    <View style={styles.filterField}>
      <Text style={styles.filterLabel}>{label}</Text>

      <TextInput
        style={[styles.filterInput, focused && styles.filterInputFocused]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray400}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function StatChip({ label, value }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Feather name="search" size={48} color={COLORS.gray300} />
      <Text style={styles.emptyTitle}>No athletes found</Text>
      <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
  },

  searchWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    height: 48,
    paddingLeft: 48,
    paddingRight: 52,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
    fontSize: 15,
    color: COLORS.black,
  },

  inputFocused: {
    borderColor: COLORS.cyan,
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  searchIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 2,
  },

  filterButton: {
    position: 'absolute',
    right: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chipsScroll: {
    marginTop: 12,
  },

  chipsContent: {
    paddingBottom: 4,
  },

  sportChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    marginRight: 8,
  },

  sportChipActive: {
    backgroundColor: COLORS.cyan,
  },

  sportChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray700,
  },

  sportChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

  filtersPanel: {
    marginTop: 12,
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: 16,
  },

  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  filterTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },

  closeFilterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterField: {
    marginBottom: 12,
  },

  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: 6,
  },

  filterInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: COLORS.white,
    color: COLORS.black,
  },

  filterInputFocused: {
    borderColor: COLORS.cyan,
  },

  ageRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  ageInput: {
    flex: 1,
  },

  clearButton: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  clearButtonText: {
    color: COLORS.cyan,
    fontWeight: '600',
    fontSize: 14,
  },

  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },

  athleteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  imageSection: {
    height: 192,
    position: 'relative',
  },

  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 96,
  },

  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  verifiedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  ratingText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  infoSection: {
    padding: 14,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  athleteName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
  },

  sportText: {
    fontSize: 13,
    color: COLORS.gray700,
    marginBottom: 2,
  },

  positionText: {
    fontSize: 13,
    color: COLORS.gray500,
  },

  statsRow: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 16,
  },

  statChip: {
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },

  statLabel: {
    fontSize: 10,
    color: COLORS.gray500,
    fontWeight: '500',
  },

  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },

  viewProfileButton: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.cyan,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  viewProfileText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },

  circleButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingHorizontal: 24,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray500,
  },

  emptyText: {
    fontSize: 13,
    color: COLORS.gray400,
    marginTop: 4,
  },
});