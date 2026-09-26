import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 390;
const responsive = (size) => Math.round(size * Math.min(Math.max(scale, 0.85), 1.18));

const COLORS = {
  cyan: '#06B6D4',
  black: '#000000',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  green: '#22C55E',
  red: '#EF4444',
  amber: '#F59E0B',
};

function formatDate(dateString) {
  if (!dateString) return null;
  try {
    // DateOnly from the backend comes through as "2026-07-15" — parsing
    // it directly avoids any timezone-shift surprises from new Date().
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function attachmentFilename(url) {
  if (!url) return 'Attachment.pdf';
  const last = url.split('/').pop() || 'Attachment.pdf';
  return decodeURIComponent(last.split('?')[0]);
}

export default function OfferDetailScreen({ navigation, route }) {
  const { offerId } = route.params;
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  const loadOffer = useCallback(async () => {
    try {
      const res = await api.get('/api/Athlete/offers');
      const found = res.data.find((o) => o.offerId === offerId);
      if (!found) {
        Alert.alert('Not Found', 'This offer could not be found.');
        navigation.goBack();
        return;
      }
      setOffer(found);
    } catch (err) {
      console.error('Failed to load offer:', err);
      Alert.alert('Error', 'Could not load this offer.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [offerId, navigation]);

  useEffect(() => {
    loadOffer();
  }, [loadOffer]);

  const handleViewAttachment = () => {
    if (!offer?.attachmentUrl) return;
    Linking.openURL(offer.attachmentUrl).catch(() => {
      Alert.alert('Error', 'Could not open this document.');
    });
  };

  const handleRespond = (approve) => {
    const actionLabel = approve ? 'Accept' : 'Decline';
    Alert.alert(
      `${actionLabel} Offer`,
      approve
        ? `Accept this offer from ${offer.scoutName}? This lets them know you're interested in attending.`
        : `Decline this offer from ${offer.scoutName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: approve ? 'default' : 'destructive',
          onPress: async () => {
            setResponding(true);
            try {
              await api.put(`/api/Athlete/offers/${offerId}/respond`, { approve });
              setOffer((prev) => ({ ...prev, status: approve ? 'Accepted' : 'Declined' }));
              Alert.alert(approve ? 'Offer Accepted' : 'Offer Declined');
            } catch (err) {
              Alert.alert('Error', err?.response?.data ?? 'Could not respond to this offer.');
            } finally {
              setResponding(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !offer) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
      </SafeAreaView>
    );
  }

  const eventDateFormatted = formatDate(offer.eventDate);
  const alreadyDecided = offer.status === 'Accepted' || offer.status === 'Declined';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.75} style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={COLORS.gray700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recruitment Offer</Text>
        <View style={{ width: responsive(36) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.trophyBanner}>
          <Ionicons name="trophy" size={22} color={COLORS.cyan} />
          <Text style={styles.trophyBannerText}>New Recruitment Offer</Text>
        </View>

        <View style={styles.fromRow}>
          <Text style={styles.fromLabel}>From: </Text>
          <Text style={styles.fromValue}>{offer.scoutName}</Text>
          {offer.scoutVerified && (
            <View style={styles.verifiedTag}>
              <Feather name="check" size={10} color={COLORS.white} />
              <Text style={styles.verifiedTagText}>Verified Scout</Text>
            </View>
          )}
        </View>
        {offer.scoutOrganization ? (
          <Text style={styles.orgText}>{offer.scoutOrganization}</Text>
        ) : null}

        <View style={styles.detailsCard}>
          <DetailRow icon="document-text-outline" label="Title" value={offer.title || 'No title provided'} />
          <DetailRow icon="calendar-outline" label="Date" value={eventDateFormatted || 'Not specified'} />
          <DetailRow icon="location-outline" label="Location" value={offer.location || 'Not specified'} />
        </View>

        {offer.attachmentUrl && (
          <View style={styles.attachmentSection}>
            <Text style={styles.attachmentSectionLabel}>OFFICIAL ATTACHMENT</Text>
            <View style={styles.attachmentCard}>
              <Ionicons name="document-attach-outline" size={22} color={COLORS.cyan} />
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachmentFilename(offer.attachmentUrl)}
              </Text>
              <TouchableOpacity
                style={styles.viewAttachmentBtn}
                onPress={handleViewAttachment}
                activeOpacity={0.75}
              >
                <Feather name="eye" size={14} color={COLORS.cyan} />
                <Text style={styles.viewAttachmentBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {alreadyDecided ? (
          <View style={[
            styles.statusBanner,
            offer.status === 'Accepted' ? styles.statusBannerAccepted : styles.statusBannerDeclined,
          ]}>
            <Ionicons
              name={offer.status === 'Accepted' ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={offer.status === 'Accepted' ? COLORS.green : COLORS.red}
            />
            <Text style={[
              styles.statusBannerText,
              { color: offer.status === 'Accepted' ? COLORS.green : COLORS.red },
            ]}>
              You {offer.status === 'Accepted' ? 'accepted' : 'declined'} this offer.
            </Text>
          </View>
        ) : offer.requiresParentConsent ? (
          <View style={styles.parentBanner}>
            <Ionicons name="people-outline" size={20} color={COLORS.amber} />
            <Text style={styles.parentBannerText}>
              This offer requires your parent's approval. They've been notified and will make the final decision.
            </Text>
          </View>
        ) : (
          <View style={styles.responseRow}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => handleRespond(false)}
              disabled={responding}
              activeOpacity={0.75}
            >
              <Text style={styles.declineBtnText}>Decline Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleRespond(true)}
              disabled={responding}
              activeOpacity={0.85}
            >
              {responding ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.acceptBtnText}>Accept Offer</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={COLORS.gray500} style={styles.detailIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  center: { alignItems: 'center', justifyContent: 'center' },
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
  scrollContent: { padding: responsive(20), paddingBottom: responsive(40) },
  trophyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(8),
    backgroundColor: '#ECFEFF',
    borderRadius: responsive(12),
    paddingVertical: responsive(12),
    paddingHorizontal: responsive(14),
    marginBottom: responsive(16),
  },
  trophyBannerText: { fontSize: responsive(14), fontWeight: '700', color: COLORS.cyan },
  fromRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: responsive(6) },
  fromLabel: { fontSize: responsive(13), color: COLORS.gray500 },
  fromValue: { fontSize: responsive(15), fontWeight: '700', color: COLORS.black },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.green,
    borderRadius: responsive(8),
    paddingHorizontal: responsive(7),
    paddingVertical: responsive(3),
  },
  verifiedTagText: { fontSize: responsive(10), fontWeight: '700', color: COLORS.white },
  orgText: { fontSize: responsive(13), color: COLORS.gray600, marginTop: responsive(2), marginBottom: responsive(16) },
  detailsCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: responsive(14),
    padding: responsive(16),
    gap: responsive(16),
    marginBottom: responsive(20),
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: responsive(10) },
  detailIcon: { marginTop: responsive(2) },
  detailLabel: { fontSize: responsive(11), fontWeight: '700', color: COLORS.gray500, textTransform: 'uppercase', marginBottom: responsive(2) },
  detailValue: { fontSize: responsive(15), fontWeight: '600', color: COLORS.black },
  attachmentSection: { marginBottom: responsive(20) },
  attachmentSectionLabel: {
    fontSize: responsive(11),
    fontWeight: '700',
    color: COLORS.gray500,
    letterSpacing: 0.5,
    marginBottom: responsive(8),
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(10),
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: responsive(12),
    padding: responsive(12),
  },
  attachmentName: { flex: 1, fontSize: responsive(13), fontWeight: '600', color: COLORS.gray700 },
  viewAttachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    borderRadius: responsive(16),
    paddingHorizontal: responsive(12),
    paddingVertical: responsive(6),
  },
  viewAttachmentBtnText: { fontSize: responsive(12), fontWeight: '700', color: COLORS.cyan },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive(8),
    borderRadius: responsive(12),
    padding: responsive(14),
  },
  statusBannerAccepted: { backgroundColor: '#F0FDF4' },
  statusBannerDeclined: { backgroundColor: '#FEF2F2' },
  statusBannerText: { fontSize: responsive(14), fontWeight: '600', flexShrink: 1 },
  parentBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsive(10),
    backgroundColor: '#FFFBEB',
    borderRadius: responsive(12),
    padding: responsive(14),
  },
  parentBannerText: { flex: 1, fontSize: responsive(13), color: '#92400E', lineHeight: responsive(19) },
  responseRow: { flexDirection: 'row', gap: responsive(10), marginTop: responsive(4) },
  declineBtn: {
    flex: 1,
    height: responsive(50),
    borderWidth: 1.5,
    borderColor: COLORS.red,
    borderRadius: responsive(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: { fontSize: responsive(15), fontWeight: '700', color: COLORS.red },
  acceptBtn: {
    flex: 1,
    height: responsive(50),
    backgroundColor: COLORS.green,
    borderRadius: responsive(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: { fontSize: responsive(15), fontWeight: '700', color: COLORS.white },
});