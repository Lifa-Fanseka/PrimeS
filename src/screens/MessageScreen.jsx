import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CONTACTS_EXPANDED_WIDTH = 130;
const CONTACTS_COLLAPSED_WIDTH = 52;

const COLORS = {
  cyan: '#06B6D4',
  cyanDark: '#0891B2',
  cyanLight: '#ECFEFF',
  cyanBorder: '#CFFAFE',
  cyanMessage: '#06B6D4',
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
  gray800: '#1F2937',
  green: '#22C55E',
  red: '#EF4444',
};

const conversations = [
  {
    id: '1',
    name: 'Coach Martinez',
    avatar: 'C',
    avatarColor: '#06B6D4',
    lastMessage: 'Great performance last week!',
    time: '2m',
    unread: true,
    unreadCount: 2,
    role: 'Coach',
    active: true,
  },
  {
    id: '2',
    name: 'Scout Johnson',
    avatar: 'S',
    avatarColor: '#3B82F6',
    lastMessage: 'Can we schedule a call?',
    time: '1h',
    unread: false,
    unreadCount: 0,
    role: 'Scout',
    active: false,
  },
  {
    id: '3',
    name: 'Team Manager',
    avatar: 'T',
    avatarColor: '#8B5CF6',
    lastMessage: 'Training at 3pm tomorrow',
    time: '3h',
    unread: false,
    unreadCount: 0,
    role: 'Manager',
    active: false,
  },
  {
    id: '4',
    name: 'Recruiter Davis',
    avatar: 'R',
    avatarColor: '#F59E0B',
    lastMessage: 'Interested in your profile',
    time: '1d',
    unread: true,
    unreadCount: 1,
    role: 'Recruiter',
    active: false,
  },
];

const initialMessages = {
  '1': [
    {
      id: '1',
      text: 'Hey! I saw your performance in the match yesterday. Really impressive!',
      sent: false,
      time: '10:30 AM',
    },
    {
      id: '2',
      text: "Thanks! I've been working hard on my game.",
      sent: true,
      time: '10:32 AM',
    },
    {
      id: '3',
      text: 'It shows! Keep up the good work. When are you available for a discussion about future opportunities?',
      sent: false,
      time: '10:35 AM',
    },
    {
      id: '4',
      text: 'That sounds great! When are you available?',
      sent: true,
      time: '10:36 AM',
    },
  ],
  '2': [
    {
      id: '1',
      text: "Hi! I've been following your stats this season.",
      sent: false,
      time: '9:00 AM',
    },
    {
      id: '2',
      text: 'Oh wow, thank you for reaching out!',
      sent: true,
      time: '9:05 AM',
    },
    {
      id: '3',
      text: 'Can we schedule a call to discuss some opportunities?',
      sent: false,
      time: '9:10 AM',
    },
  ],
  '3': [
    {
      id: '1',
      text: "Training at 3pm tomorrow, don't forget!",
      sent: false,
      time: 'Yesterday',
    },
    {
      id: '2',
      text: "Got it, I'll be there!",
      sent: true,
      time: 'Yesterday',
    },
  ],
  '4': [
    {
      id: '1',
      text: "Hello! I came across your profile and I'm very interested.",
      sent: false,
      time: 'Mon',
    },
    {
      id: '2',
      text: "Thank you, I'd love to hear more.",
      sent: true,
      time: 'Mon',
    },
    {
      id: '3',
      text: "Let's connect properly.",
      sent: false,
      time: 'Mon',
    },
  ],
};

export default function MessagesScreen({ navigation }) {
  const contactsWidth = useRef(
    new Animated.Value(CONTACTS_EXPANDED_WIDTH)
  ).current;

  const flatListRef = useRef(null);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState('1');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allMessages, setAllMessages] = useState({ ...initialMessages });

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId);
  }, [selectedConversationId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const bubbleMaxWidth =
    SCREEN_WIDTH -
    (isCollapsed ? CONTACTS_COLLAPSED_WIDTH : CONTACTS_EXPANDED_WIDTH) -
    54;

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, [selectedConversationId]);

  const toggleContacts = () => {
    const nextCollapsed = !isCollapsed;
    const toValue = nextCollapsed
      ? CONTACTS_COLLAPSED_WIDTH
      : CONTACTS_EXPANDED_WIDTH;

    Animated.timing(contactsWidth, {
      toValue,
      duration: 280,
      useNativeDriver: false,
    }).start();

    setIsCollapsed(nextCollapsed);
  };

  const handleSend = () => {
    if (!messageInput.trim()) return;

    const conversationId = selectedConversationId;

    const newMsg = {
      id: Date.now().toString(),
      text: messageInput.trim(),
      sent: true,
      time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };

    setAllMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMsg],
    }));

    setMessageInput('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      const reply = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for your message! I'll get back to you soon.",
        sent: false,
        time: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      };

      setAllMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), reply],
      }));

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 2000);
  };

  const renderMessage = ({ item }) => {
    return (
      <View
        style={[
          styles.messageRow,
          { justifyContent: item.sent ? 'flex-end' : 'flex-start' },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            item.sent ? styles.sentBubble : styles.receivedBubble,
            { maxWidth: bubbleMaxWidth },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.sent ? styles.sentMessageText : styles.receivedMessageText,
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[
              styles.messageTime,
              item.sent ? styles.sentTime : styles.receivedTime,
            ]}
          >
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* TOP HEADER */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.topIconButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color={COLORS.gray700} />
          </TouchableOpacity>

          <Text style={styles.topTitle}>Messages</Text>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.topIconButton}
            onPress={() => Alert.alert('Settings', 'Settings screen coming soon.')}
          >
            <Feather name="settings" size={18} color={COLORS.gray600} />
          </TouchableOpacity>
        </View>

        {/* BODY */}
        <View style={styles.body}>
          {/* CONTACTS PANEL */}
          <Animated.View
            style={[styles.contactsPanel, { width: contactsWidth }]}
          >
            <View
              style={[
                styles.contactsTopRow,
                isCollapsed && styles.contactsTopRowCollapsed,
              ]}
            >
              {!isCollapsed && (
                <View style={styles.contactSearchWrapper}>
                  <Feather
                    name="search"
                    size={10}
                    color={COLORS.gray400}
                    style={styles.contactSearchIcon}
                  />

                  <TextInput
                    style={styles.contactSearchInput}
                    placeholder="Search"
                    placeholderTextColor={COLORS.gray400}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.collapseButton}
                onPress={toggleContacts}
              >
                <Feather
                  name={isCollapsed ? 'chevron-right' : 'chevron-left'}
                  size={16}
                  color={COLORS.gray500}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.contactsScroll}>
              {filteredConversations.map((conv) => {
                const selected = conv.id === selectedConversationId;
                const firstName = conv.name.split(' ')[0];

                return (
                  <TouchableOpacity
                    key={conv.id}
                    activeOpacity={0.75}
                    style={[
                      styles.contactRow,
                      selected && styles.contactRowSelected,
                    ]}
                    onPress={() => setSelectedConversationId(conv.id)}
                  >
                    <View style={styles.avatarWrapper}>
                      <View
                        style={[
                          styles.contactAvatar,
                          {
                            backgroundColor: conv.avatarColor,
                            width: isCollapsed ? 36 : 38,
                            height: isCollapsed ? 36 : 38,
                            borderRadius: isCollapsed ? 18 : 19,
                          },
                        ]}
                      >
                        <Text style={styles.contactAvatarText}>
                          {conv.avatar}
                        </Text>
                      </View>

                      {conv.unread && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>
                            {conv.unreadCount || 1}
                          </Text>
                        </View>
                      )}
                    </View>

                    {!isCollapsed && (
                      <View style={styles.contactInfo}>
                        <Text
                          style={styles.contactName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {firstName}
                        </Text>

                        <Text style={styles.contactTime}>{conv.time}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          <View style={styles.verticalDivider} />

          {/* CHAT PANEL */}
          <View style={styles.chatPanel}>
            <View style={styles.chatHeader}>
              <View
                style={[
                  styles.chatAvatar,
                  { backgroundColor: selectedConversation?.avatarColor },
                ]}
              >
                <Text style={styles.chatAvatarText}>
                  {selectedConversation?.avatar}
                </Text>
              </View>

              <View style={styles.chatInfo}>
                <Text
                  style={styles.chatName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedConversation?.name}
                </Text>

                <Text style={styles.chatStatus}>Active now</Text>
              </View>
            </View>

            <FlatList
              ref={flatListRef}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              data={allMessages[selectedConversationId] || []}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              ListEmptyComponent={
                <View style={styles.emptyMessages}>
                  <Feather name="send" size={32} color={COLORS.gray300} />
                  <Text style={styles.emptyMessagesText}>
                    No messages yet. Say hello!
                  </Text>
                </View>
              }
            />

            <View style={styles.inputBar}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.attachButton}
                onPress={() =>
                  Alert.alert(
                    'Coming Soon',
                    'File attachments will be available soon.'
                  )
                }
              >
                <Feather name="paperclip" size={18} color={COLORS.gray500} />
              </TouchableOpacity>

              <TextInput
                style={styles.messageInput}
                placeholder="Type a message..."
                placeholderTextColor={COLORS.gray400}
                value={messageInput}
                onChangeText={setMessageInput}
                multiline
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={handleSend}
              />

              <TouchableOpacity
                activeOpacity={0.75}
                style={[
                  styles.sendButton,
                  messageInput.trim()
                    ? styles.sendButtonActive
                    : styles.sendButtonInactive,
                ]}
                disabled={!messageInput.trim()}
                onPress={handleSend}
              >
                <Feather
                  name="send"
                  size={14}
                  color={messageInput.trim() ? COLORS.white : COLORS.gray400}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  keyboardView: {
    flex: 1,
  },

  topHeader: {
    height: 52,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  topIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.black,
  },

  body: {
    flex: 1,
    flexDirection: 'row',
  },

  contactsPanel: {
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },

  contactsTopRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: 4,
  },

  contactsTopRowCollapsed: {
    justifyContent: 'center',
  },

  contactSearchWrapper: {
    flex: 1,
    height: 28,
    position: 'relative',
    justifyContent: 'center',
  },

  contactSearchIcon: {
    position: 'absolute',
    left: 7,
    zIndex: 2,
  },

  contactSearchInput: {
    height: 28,
    backgroundColor: COLORS.gray100,
    borderRadius: 6,
    paddingLeft: 22,
    paddingRight: 8,
    fontSize: 11,
    color: COLORS.black,
  },

  collapseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  contactsScroll: {
    flex: 1,
  },

  contactRow: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray50,
    backgroundColor: COLORS.white,
  },

  contactRowSelected: {
    backgroundColor: COLORS.cyanLight,
  },

  avatarWrapper: {
    position: 'relative',
  },

  contactAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  contactAvatarText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },

  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },

  unreadBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },

  contactInfo: {
    width: '100%',
    paddingHorizontal: 2,
    marginTop: 5,
  },

  contactName: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray800,
    textAlign: 'center',
  },

  contactTime: {
    fontSize: 9,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: 1,
  },

  verticalDivider: {
    width: 1,
    backgroundColor: COLORS.gray200,
  },

  chatPanel: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  chatHeader: {
    height: 52,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },

  chatAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chatAvatarText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },

  chatInfo: {
    flex: 1,
  },

  chatName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },

  chatStatus: {
    fontSize: 10,
    color: COLORS.green,
    fontWeight: '500',
    marginTop: 1,
  },

  messagesList: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },

  messagesContent: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },

  sentBubble: {
    backgroundColor: COLORS.cyanMessage,
    borderBottomRightRadius: 2,
  },

  receivedBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },

  sentMessageText: {
    color: COLORS.white,
  },

  receivedMessageText: {
    color: COLORS.gray800,
  },

  messageTime: {
    fontSize: 9,
    marginTop: 3,
    textAlign: 'right',
  },

  sentTime: {
    color: 'rgba(255,255,255,0.75)',
  },

  receivedTime: {
    color: COLORS.gray400,
  },

  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },

  emptyMessagesText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.gray400,
  },

  inputBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  attachButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  messageInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: COLORS.gray100,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.black,
  },

  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonActive: {
    backgroundColor: COLORS.cyan,
  },

  sendButtonInactive: {
    backgroundColor: COLORS.gray200,
  },
});