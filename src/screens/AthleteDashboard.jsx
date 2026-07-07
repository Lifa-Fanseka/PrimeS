import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AthleteDashboard({ navigation }) {
  const [activeTab, setActiveTab] = useState('Home');
  const [likedPost1, setLikedPost1] = useState(false);
  const [likedPost3, setLikedPost3] = useState(false);
  const [likedPost4, setLikedPost4] = useState(false);
  const [connectedOne, setConnectedOne] = useState(false);
  const [connectedTwo, setConnectedTwo] = useState(false);

  const [commentModal, setCommentModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [photoModal, setPhotoModal] = useState(false);
  const [statsModal, setStatsModal] = useState(false);

  const iconButton = (icon, onPress, badge = false) => (
    <Pressable style={styles.headerIconButton} onPress={onPress}>
      <Feather name={icon} size={21} color="#111827" />
      {badge && <View style={styles.redDot} />}
    </Pressable>
  );

  const avatarGradient = (size = 48) => (
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

  const ActionButton = ({ icon, label, color = '#6B7280', onPress }) => (
    <Pressable style={styles.actionButton} onPress={onPress}>
      <Feather name={icon} size={18} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* FIXED HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>PRIME SCOUT</Text>

        <View style={styles.headerActions}>
          {iconButton('search', () => navigation.navigate('Search'))}
         {iconButton('message-circle', () => navigation.navigate('Messages'), true)}
           {iconButton('settings', () => navigation.navigate('Settings'))}
        </View>
      </View>

      {/* SCROLLABLE FEED */}
      <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent}>
        {/* PROFILE CARD */}
        <View style={styles.card}>
          <View style={styles.profileTop}>
            {avatarGradient(64)}
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Complete your profile</Text>
              <Text style={styles.smallGray}>3 of 5 steps completed</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <View style={styles.checkRow}>
            <Feather name="check-circle" size={20} color="#22C55E" />
            <Text style={styles.checkText}>Add profile photo</Text>
          </View>

          <Pressable style={styles.checkRow} onPress={() => alert('Upload screen')}>
            <Feather name="circle" size={20} color="#9CA3AF" />
            <Text style={styles.checkText}>Upload highlight video</Text>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </Pressable>

          <Pressable style={styles.checkRow} onPress={() => setStatsModal(true)}>
            <Feather name="circle" size={20} color="#9CA3AF" />
            <Text style={styles.checkText}>Add performance stats</Text>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* CREATE POST */}
        <View style={styles.card}>
          <View style={styles.createTop}>
            {avatarGradient(40)}
            <Pressable style={styles.postInput} onPress={() => setPhotoModal(true)}>
              <Text style={styles.placeholder}>Share an update...</Text>
            </Pressable>
          </View>

          <View style={styles.createDivider} />

          <View style={styles.createActions}>
            <Pressable style={styles.createAction} onPress={() => setPhotoModal(true)}>
              <Feather name="camera" size={18} color="#06B6D4" />
              <Text style={styles.createActionText}>Photo</Text>
            </Pressable>

            <Pressable style={styles.createAction} onPress={() => alert('Video upload screen')}>
              <Feather name="video" size={18} color="#06B6D4" />
              <Text style={styles.createActionText}>Video</Text>
            </Pressable>

            <Pressable style={styles.createAction} onPress={() => setStatsModal(true)}>
              <Feather name="award" size={18} color="#06B6D4" />
              <Text style={styles.createActionText}>Stats</Text>
            </Pressable>
          </View>
        </View>

        {/* POST 1 */}
        <View style={styles.card}>
          <Author avatarColor="#06B6D4" name="Jordan Martinez" subtitle="Basketball • 2 hours ago" />

          <Text style={styles.postText}>
            Championship game highlights! 🏀 Lakers Youth defeated Warriors Jr. 85-72.
            Proud of my team's performance tonight.
          </Text>

          <VideoCard
            image="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop"
            duration="2:45"
            color="#06B6D4"
          />

          <View style={styles.statsChip}>
            <Feather name="award" size={32} color="#06B6D4" />
            <View>
              <Text style={styles.statsBold}>28 Points • 12 Rebounds</Text>
              <Text style={styles.smallGray}>Career High Performance</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <ActionButton icon="user" label="View Profile" color="#06B6D4" />
            <ActionButton
              icon="heart"
              label="Like"
              color={likedPost1 ? '#EF4444' : '#6B7280'}
              onPress={() => setLikedPost1(!likedPost1)}
            />
            <ActionButton icon="message-circle" label="Comment" onPress={() => setCommentModal(true)} />
          </View>
        </View>

        {/* POST 2 */}
        <View style={styles.card}>
          <View style={styles.authorRow}>
            <View style={[styles.solidAvatar, { backgroundColor: '#3B82F6' }]}>
              <Feather name="eye" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.authorName}>Scout Activity</Text>
              <Text style={styles.authorSubtitle}>4 hours ago</Text>
            </View>
          </View>

          <View style={styles.scoutBox}>
            <View style={styles.scoutRow}>
              <View style={[styles.solidAvatar, { width: 40, height: 40, backgroundColor: '#06B6D4' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>Mike Johnson</Text>
                <Text style={styles.authorSubtitle}>College Scout • UCLA</Text>
              </View>
              <Feather name="check-circle" size={20} color="#06B6D4" />
            </View>

            <Text style={styles.scoutText}>
              Viewed your profile and saved your highlight reel
            </Text>

            <Pressable style={styles.scoutButton}>
              <Text style={styles.scoutButtonText}>View Scout Profile</Text>
            </Pressable>
          </View>
        </View>

        {/* POST 3 */}
        <View style={styles.card}>
          <Author avatarColor="#A855F7" name="Alex Chen" subtitle="Track & Field • 1 day ago" />

          <Text style={styles.postText}>
            New highlight reel from the regional tournament! Check out my personal best
            in the 400m dash. 🏃‍♂️💨
          </Text>

          <VideoCard
            image="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop"
            duration="1:23"
            color="#A855F7"
            verified
          />

          <View style={styles.actionRow}>
            <ActionButton
              icon="heart"
              label={`${likedPost3 ? 46 : 45}`}
              color={likedPost3 ? '#EF4444' : '#6B7280'}
              onPress={() => setLikedPost3(!likedPost3)}
            />
            <ActionButton icon="message-circle" label="12" onPress={() => setCommentModal(true)} />
            <ActionButton icon="share-2" label="Share" onPress={() => setShareModal(true)} />
          </View>
        </View>

        {/* POST 4 */}
        <View style={styles.card}>
          <Author avatarColor="#22C55E" name="Sarah Williams" subtitle="Football • 2 days ago" />

          <Text style={styles.postText}>
            Team training session at the new facility! Loving the upgraded equipment. 💪⚽
          </Text>

          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1200&auto=format&fit=crop',
            }}
            style={styles.photoPost}
          />

          <View style={styles.actionRow}>
            <ActionButton
              icon="heart"
              label={`${likedPost4 ? 68 : 67}`}
              color={likedPost4 ? '#EF4444' : '#6B7280'}
              onPress={() => setLikedPost4(!likedPost4)}
            />
            <ActionButton icon="message-circle" label="23" onPress={() => setCommentModal(true)} />
            <ActionButton icon="share-2" label="Share" onPress={() => setShareModal(true)} />
          </View>
        </View>

        {/* SUGGESTED SCOUTS */}
        <View style={styles.card}>
          <View style={styles.suggestedHeader}>
            <Feather name="users" size={20} color="#06B6D4" />
            <Text style={styles.cardTitle}>Suggested Scouts</Text>
          </View>

          <ScoutSuggestion
            name="David Thompson"
            connected={connectedOne}
            onPress={() => setConnectedOne(!connectedOne)}
          />

          <ScoutSuggestion
            name="Emily Carter"
            connected={connectedTwo}
            onPress={() => setConnectedTwo(!connectedTwo)}
          />
        </View>
      </ScrollView>

      {/* FIXED BOTTOM NAV */}
      <View style={styles.bottomNav}>
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

  if (tab === 'Home') {
    return;
  }

  if (tab === 'Messages') {
    navigation.navigate('Messages');
  }

  if (tab === 'Notifications') {
    navigation.navigate('Notifications');
  }

  if (tab === 'Me') {
    navigation.navigate('MeProfile');
  }
}}
>
            <View>
              <Feather
                name={icon}
                size={24}
                color={activeTab === tab ? '#06B6D4' : '#6B7280'}
              />
              {(tab === 'Messages' || tab === 'Notifications') && <View style={styles.navDot} />}
            </View>
            <Text
              style={[
                styles.navLabel,
                activeTab === tab && { color: '#06B6D4' },
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <CommentModal visible={commentModal} onClose={() => setCommentModal(false)} />
      <ShareModal visible={shareModal} onClose={() => setShareModal(false)} />
      <PhotoModal visible={photoModal} onClose={() => setPhotoModal(false)} />
      <StatsModal visible={statsModal} onClose={() => setStatsModal(false)} />
    </SafeAreaView>
  );
}

function Author({ avatarColor, name, subtitle }) {
  return (
    <View style={styles.authorRow}>
      <View style={[styles.solidAvatar, { backgroundColor: avatarColor }]} />
      <View>
        <Text style={styles.authorName}>{name}</Text>
        <Text style={styles.authorSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function VideoCard({ image, duration, color, verified }) {
  return (
    <View style={styles.videoCard}>
      <Image source={{ uri: image }} style={styles.videoImage} />
      <View style={styles.videoOverlay} />

      {verified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>VERIFIED</Text>
        </View>
      )}

      <View style={styles.playButton}>
        <Feather name="play" size={28} color={color} />
      </View>

      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{duration}</Text>
      </View>
    </View>
  );
}

function ScoutSuggestion({ name, connected, onPress }) {
  return (
    <View style={styles.scoutSuggestion}>
      <LinearGradient colors={['#3B82F6', '#06B6D4']} style={styles.scoutAvatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.authorName}>{name}</Text>
        <Text style={styles.authorSubtitle}>College Scout • Stanford</Text>
      </View>
      <Pressable
        style={[styles.connectButton, connected && styles.connectButtonActive]}
        onPress={onPress}
      >
        <Text style={[styles.connectText, connected && styles.connectTextActive]}>
          {connected ? 'Connected' : 'Connect'}
        </Text>
      </Pressable>
    </View>
  );
}

function CommentModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <ModalHeader title="Comments on Jordan's post" onClose={onClose} />

          {['Great performance!', 'This highlight is fire 🔥', 'Keep pushing!'].map((c, i) => (
            <View key={i} style={styles.commentRow}>
              <View style={styles.commentAvatar} />
              <View>
                <Text style={styles.authorName}>User {i + 1}</Text>
                <Text style={styles.commentText}>{c}</Text>
                <Text style={styles.authorSubtitle}>{i + 1}h ago</Text>
              </View>
            </View>
          ))}

          <View style={styles.commentInputRow}>
            <TextInput style={styles.commentInput} placeholder="Write a comment..." />
            <Pressable style={styles.sendButton}>
              <Feather name="send" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ShareModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.centerModal}>
          <ModalHeader title="Share post" onClose={onClose} />

          <View style={styles.shareGrid}>
            {['Copy Link', 'WhatsApp', 'Twitter/X', 'Instagram'].map((item) => (
              <Pressable key={item} style={styles.shareOption}>
                <Feather name="share-2" size={22} color="#06B6D4" />
                <Text style={styles.shareText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PhotoModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <ModalHeader title="Create Photo Post" onClose={onClose} />

          <View style={styles.uploadBox}>
            <Feather name="camera" size={32} color="#06B6D4" />
            <Text style={styles.placeholder}>Tap to upload image</Text>
          </View>

          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            multiline
          />

          <Pressable style={styles.scoutButton}>
            <Text style={styles.scoutButtonText}>Post</Text>
          </Pressable>

          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function StatsModal({ visible, onClose }) {
  const fields = ['Goals', 'Assists', 'Matches Played', 'Rating out of 10', 'Sport', 'Season'];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <ModalHeader title="Upload Stats" onClose={onClose} />

          <ScrollView>
            {fields.map((field) => (
              <TextInput key={field} style={styles.modalInput} placeholder={field} />
            ))}

            <Pressable style={styles.scoutButton}>
              <Text style={styles.scoutButtonText}>Submit Stats</Text>
            </Pressable>

            <Pressable onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
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

  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLogo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
  },

  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },

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

  feed: { flex: 1 },
  feedContent: { paddingBottom: 16 },

  card: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 16,
  },

  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  gradientAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },

  smallGray: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },

  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 99,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },

  progressFill: {
    width: '60%',
    height: 8,
    borderRadius: 99,
    backgroundColor: '#06B6D4',
  },

  checkRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  checkText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },

  createTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  postInput: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  placeholder: {
    color: '#9CA3AF',
    fontSize: 14,
  },

  createDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: 12,
    marginBottom: 12,
  },

  createActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  createAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },

  createActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  solidAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },

  authorSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  postText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 21,
    marginBottom: 8,
  },

  videoCard: {
    height: 256,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 12,
  },

  videoImage: {
    width: '100%',
    height: '100%',
  },

  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

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

  durationBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
  },

  verifiedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#A855F7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  verifiedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  statsChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },

  statsBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

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

  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  scoutBox: {
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#CFFAFE',
    borderRadius: 8,
    padding: 12,
  },

  scoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  scoutText: {
    fontSize: 14,
    color: '#4B5563',
    marginVertical: 12,
  },

  scoutButton: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  photoPost: {
    width: '100%',
    height: 288,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 12,
  },

  suggestedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

  scoutSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },

  scoutAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  connectButton: {
    borderWidth: 2,
    borderColor: '#06B6D4',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  connectButtonActive: {
    backgroundColor: '#06B6D4',
  },

  connectText: {
    color: '#06B6D4',
    fontWeight: '700',
    fontSize: 13,
  },

  connectTextActive: {
    color: '#FFFFFF',
  },

  bottomNav: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 8,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 3,
  },

  navDot: {
    position: 'absolute',
    top: -1,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    maxHeight: '82%',
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

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  commentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },

  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#06B6D4',
  },

  commentText: {
    fontSize: 14,
    color: '#374151',
  },

  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  commentInput: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  shareOption: {
    width: '47%',
    height: 84,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  shareText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  uploadBox: {
    height: 160,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#06B6D4',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

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

  cancelText: {
    textAlign: 'center',
    marginTop: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
});