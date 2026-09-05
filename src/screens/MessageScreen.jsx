import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import api from '../api/client';
import {
  addMessageListener,
  addReadListener,
  sendChatMessage,
  markThreadAsRead,
  checkOnline,
  isChatConnected,
} from '../api/chat';

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  blue: '#2563EB',
  black: '#111111',
  white: '#FFFFFF',

  backdrop: '#F4F4F2',

  gray100: '#F3F4F6',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
};

/* =========================================================
   AVATAR COLORS
========================================================= */

const AVATAR_PALETTE = [
  '#2563EB',
  '#7C3AED',
  '#059669',
  '#D97706',
  '#DB2777',
];

function avatarColorFor(id) {
  const numericId = Number(id) || 0;

  return AVATAR_PALETTE[
    Math.abs(numericId) % AVATAR_PALETTE.length
  ];
}

/* =========================================================
   TIME HELPERS
========================================================= */

/*
 * The backend sends dateSent without an explicit timezone marker
 * (no trailing "Z" or "+HH:MM" offset). JavaScript's Date parser
 * treats a string like that as LOCAL time, not UTC — so every
 * timestamp silently shifts by the device's UTC offset. That's
 * exactly why a message sent "just now" was showing as "2h" in
 * the conversation list for anyone outside UTC (e.g. South Africa,
 * UTC+2): the parsed instant ends up ~2 hours in the past.
 *
 * Fix: if the string has no timezone info, treat it as UTC by
 * appending "Z" before parsing. Every place that parses a raw
 * server timestamp goes through this function instead of calling
 * `new Date(...)` directly.
 */
function toUtcDate(dateString) {
  if (!dateString) return null;
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(dateString);
  return new Date(hasTimezone ? dateString : `${dateString}Z`);
}

function formatShortTime(dateString) {
  if (!dateString) return '';

  const diffMs =
    Date.now() -
    toUtcDate(dateString).getTime();

  const mins = Math.floor(
    diffMs / 60000
  );

  if (mins < 1) return 'now';

  if (mins < 60) {
    return `${mins}m`;
  }

  const hours = Math.floor(
    mins / 60
  );

  if (hours < 24) {
    return `${hours}h`;
  }

  return `${Math.floor(hours / 24)}d`;
}

function formatBubbleTime(dateString) {
  if (!dateString) return '';

  return toUtcDate(dateString).toLocaleTimeString(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
  );
}

function dayKey(dateString) {
  const d = toUtcDate(dateString);

  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dateChipLabel(dateString) {
  const d = toUtcDate(dateString);

  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';

  return d.toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }
  );
}

/*
 * Builds a flat render list: date-chip items interspersed
 * with message items, each message annotated with its group
 * position (first/last in its consecutive same-sender run).
 * This drives grouped timestamps.
 */
function buildThreadItems(messages) {
  const items = [];
  let lastDayKey = null;

  messages.forEach((msg, index) => {
    const thisDayKey = dayKey(msg.dateSent);

    if (thisDayKey !== lastDayKey) {
      items.push({
        type: 'date',
        id: `date-${thisDayKey}`,
        label: dateChipLabel(msg.dateSent),
      });

      lastDayKey = thisDayKey;
    }

    const prev = messages[index - 1];
    const next = messages[index + 1];

    const isFirstInGroup =
      !prev ||
      prev.senderId !== msg.senderId ||
      dayKey(prev.dateSent) !== thisDayKey;

    const isLastInGroup =
      !next ||
      next.senderId !== msg.senderId ||
      dayKey(next.dateSent) !== thisDayKey;

    items.push({
      type: 'message',
      id: String(msg.messageId ?? `${index}-${msg.dateSent}`),
      msg,
      isFirstInGroup,
      isLastInGroup,
    });
  });

  return items;
}

/* =========================================================
   MAIN SCREEN
========================================================= */

export default function MessagesScreen({
  navigation,
  route,
}) {
  const insets = useSafeAreaInsets();

  const {
    width: screenWidth,
  } = useWindowDimensions();

  /* =======================================================
     RESPONSIVE VALUES
  ======================================================= */

  const isSmallPhone =
    screenWidth < 360;

  const horizontalPadding =
    isSmallPhone ? 14 : 20;

  const messageHorizontalPadding =
    isSmallPhone ? 12 : 16;

  /* =======================================================
     FONTS
  ======================================================= */

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  /* =======================================================
     USER
  ======================================================= */

  const [myUserId, setMyUserId] =
    useState(null);

  const myUserIdRef =
    useRef(null);

  /* =======================================================
     VIEW STATE
  ======================================================= */

  const [view, setView] =
    useState('list');

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState(null);

  /* =======================================================
     INPUT / SEARCH
  ======================================================= */

  const [messageInput, setMessageInput] =
    useState('');

  const [searchQuery, setSearchQuery] =
    useState('');

  /* =======================================================
     DATA
  ======================================================= */

  const [conversations, setConversations] =
    useState([]);

  const [allMessages, setAllMessages] =
    useState({});

  /* =======================================================
     LOADING / CONNECTION
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [connected, setConnected] =
    useState(false);

  const [otherOnline, setOtherOnline] =
    useState(false);

  /* =======================================================
     REFS
  ======================================================= */

  const flatListRef =
    useRef(null);

  const selectedConversationRef =
    useRef(null);

  /* =======================================================
     SELECTED CONVERSATION REF
  ======================================================= */

  useEffect(() => {
    selectedConversationRef.current =
      selectedConversationId;
  }, [
    selectedConversationId,
  ]);

  /* =======================================================
     SELECTED CONVERSATION
  ======================================================= */

  const selectedConversation =
    useMemo(
      () =>
        conversations.find(
          (c) =>
            c.otherUserId ===
            selectedConversationId
        ),
      [
        conversations,
        selectedConversationId,
      ]
    );

  /* =======================================================
     FILTERED CONVERSATIONS
  ======================================================= */

  const filteredConversations =
    useMemo(() => {
      const q =
        searchQuery
          .trim()
          .toLowerCase();

      if (!q) {
        return conversations;
      }

      return conversations.filter(
        (c) =>
          (
            c.otherUserName || ''
          )
            .toLowerCase()
            .includes(q)
      );
    }, [
      conversations,
      searchQuery,
    ]);

  /* =======================================================
     LOAD CONVERSATIONS
  ======================================================= */

  const loadConversations =
    useCallback(async () => {
      try {
        const res =
          await api.get(
            '/api/Message/conversations'
          );

        setConversations(
          res.data
        );

        return res.data;
      } catch (err) {
        console.error(
          'Failed to load conversations:',
          err
        );

        return [];
      }
    }, []);

  /* =======================================================
     LOAD MESSAGE HISTORY
  ======================================================= */

  const loadHistory =
    useCallback(
      async (otherUserId) => {
        setLoadingMessages(true);

        try {
          const res =
            await api.get(
              `/api/Message/${otherUserId}`
            );

          setAllMessages(
            (prev) => ({
              ...prev,
              [otherUserId]:
                res.data,
            })
          );
        } catch (err) {
          console.error(
            'Failed to load message history:',
            err
          );
        } finally {
          setLoadingMessages(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     INCOMING CHAT MESSAGE
  ======================================================= */

  const handleIncomingMessage =
    useCallback(
      (dto) => {
        const currentUserId =
          myUserIdRef.current;

        const otherUserId =
          dto.senderId ===
          currentUserId
            ? dto.receiverId
            : dto.senderId;

        setAllMessages(
          (prev) => ({
            ...prev,

            [otherUserId]: [
              ...(prev[
                otherUserId
              ] || []),
              dto,
            ],
          })
        );

        const isIncoming =
          dto.senderId !==
          currentUserId;

        const isCurrentlyOpen =
          selectedConversationRef.current ===
            otherUserId &&
          view === 'thread';

        setConversations(
          (prev) => {
            const exists =
              prev.find(
                (c) =>
                  c.otherUserId ===
                  otherUserId
              );

            const updated =
              exists
                ? prev.map((c) =>
                    c.otherUserId ===
                    otherUserId
                      ? {
                          ...c,

                          lastMessageText:
                            dto.messageText,

                          lastMessageDate:
                            dto.dateSent,

                          lastMessageFromMe:
                            dto.senderId ===
                            currentUserId,

                          unreadCount:
                            isIncoming &&
                            !isCurrentlyOpen
                              ? (c.unreadCount || 0) + 1
                              : c.unreadCount || 0,
                        }
                      : c
                  )
                : [
                    {
                      otherUserId,

                      otherUserName:
                        `User ${otherUserId}`,

                      lastMessageText:
                        dto.messageText,

                      lastMessageDate:
                        dto.dateSent,

                      lastMessageFromMe:
                        dto.senderId ===
                        currentUserId,

                      unreadCount:
                        isIncoming &&
                        !isCurrentlyOpen
                          ? 1
                          : 0,
                    },

                    ...prev,
                  ];

            return updated.sort(
              (a, b) =>
                toUtcDate(b.lastMessageDate) -
                toUtcDate(a.lastMessageDate)
            );
          }
        );

        if (isCurrentlyOpen && isIncoming) {
          markThreadAsRead(otherUserId).catch(() => {});
        }

        if (
          selectedConversationRef.current ===
          otherUserId
        ) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd(
              {
                animated: true,
              }
            );
          }, 100);
        }
      },
      [view]
    );

  /* =======================================================
     MESSAGES READ (live read-receipt updates)
  ======================================================= */

  const handleMessagesRead =
    useCallback(
      (readerUserId) => {
        setAllMessages(
          (prev) => {
            const thread =
              prev[readerUserId];

            if (!thread) return prev;

            return {
              ...prev,

              [readerUserId]:
                thread.map((m) =>
                  m.senderId ===
                  myUserIdRef.current
                    ? { ...m, isRead: true }
                    : m
                ),
            };
          }
        );
      },
      []
    );

  /* =======================================================
     INITIALIZE
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const removeMessageListener =
      addMessageListener(
        handleIncomingMessage
      );

    const removeReadListener =
      addReadListener(
        handleMessagesRead
      );

    setConnected(
      isChatConnected()
    );

    (async () => {
      try {
        const idStr =
          await AsyncStorage.getItem(
            'userId'
          );

        const id =
          idStr
            ? parseInt(
                idStr,
                10
              )
            : null;

        if (!mounted) return;

        myUserIdRef.current =
          id;

        setMyUserId(id);

        const convos =
          await loadConversations();

        if (!mounted) return;

        const recipientId =
          route?.params
            ?.recipientId;

        const recipientName =
          route?.params
            ?.recipientName;

        if (recipientId) {
          const existing =
            convos.find(
              (c) =>
                c.otherUserId ===
                recipientId
            );

          if (!existing) {
            setConversations(
              (prev) => [
                {
                  otherUserId:
                    recipientId,

                  otherUserName:
                    recipientName ??
                    `User ${recipientId}`,

                  lastMessageText:
                    null,

                  lastMessageDate:
                    null,

                  lastMessageFromMe:
                    false,

                  unreadCount: 0,
                },

                ...prev,
              ]
            );
          }

          openThread(
            recipientId
          );
        }
      } catch (err) {
        console.error(
          'Failed to initialize messages:',
          err
        );
      } finally {
        if (mounted) {
          setLoading(
            false
          );
        }
      }
    })();

    return () => {
      mounted = false;

      removeMessageListener();
      removeReadListener();
    };
  }, [
    handleIncomingMessage,
    handleMessagesRead,
    loadConversations,
    route,
  ]);

  /* =======================================================
     OPEN THREAD
  ======================================================= */

  const openThread =
    useCallback(
      (otherUserId) => {
        setSelectedConversationId(
          otherUserId
        );

        setView('thread');

        setConversations(
          (prev) =>
            prev.map((c) =>
              c.otherUserId === otherUserId
                ? { ...c, unreadCount: 0 }
                : c
            )
        );

        markThreadAsRead(otherUserId).catch(() => {});

        checkOnline(otherUserId)
          .then(setOtherOnline)
          .catch(() => setOtherOnline(false));

        if (
          !allMessages[
            otherUserId
          ]
        ) {
          loadHistory(
            otherUserId
          );
        }

        setTimeout(() => {
          flatListRef.current?.scrollToEnd(
            {
              animated: false,
            }
          );
        }, 150);
      },
      [
        allMessages,
        loadHistory,
      ]
    );

  /* =======================================================
     CLOSE THREAD
  ======================================================= */

  const closeThread =
    useCallback(() => {
      setView('list');

      setSelectedConversationId(
        null
      );

      setMessageInput('');
    }, []);

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  const handleSend =
    async () => {
      if (
        !messageInput.trim() ||
        !selectedConversationId
      ) {
        return;
      }

      const text =
        messageInput.trim();

      setMessageInput('');

      try {
        await sendChatMessage(
          selectedConversationId,
          text
        );
      } catch (err) {
        Alert.alert(
          'Error',
          'Could not send message. Please try again.'
        );

        setMessageInput(
          text
        );
      }
    };

  /* =======================================================
     CONVERSATION ROW
  ======================================================= */

  const renderConversationRow =
    ({
      item,
      index,
    }) => {
      const unreadCount =
        item.unreadCount || 0;

      const isUnread =
        unreadCount > 0;

      const name =
        item.otherUserName ||
        `User ${item.otherUserId}`;

      const initial =
        name
          .charAt(0)
          .toUpperCase();

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.row,

            index === 0 && {
              marginTop: 4,
            },
          ]}
          onPress={() =>
            openThread(
              item.otherUserId
            )
          }
        >
          <View
            style={
              styles.avatarWrap
            }
          >
            <View
              style={[
                styles.avatar,

                {
                  backgroundColor:
                    avatarColorFor(
                      item.otherUserId
                    ),
                },
              ]}
            >
              <Text
                style={
                  styles.avatarText
                }
              >
                {initial}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.rowContent
            }
          >
            <View
              style={
                styles.rowTopLine
              }
            >
              <Text
                style={[
                  styles.rowName,

                  isUnread &&
                    styles.rowNameUnread,
                ]}
                numberOfLines={1}
              >
                {name}
              </Text>

              <Text
                style={[
                  styles.rowTime,

                  isUnread &&
                    styles.rowTimeUnread,
                ]}
              >
                {formatShortTime(
                  item.lastMessageDate
                )}
              </Text>
            </View>

            <View
              style={
                styles.rowBottomLine
              }
            >
              <Text
                style={
                  styles.rowPreview
                }
                numberOfLines={1}
              >
                {item.lastMessageFromMe
                  ? 'You: '
                  : ''}

                {item.lastMessageText ||
                  'Say hello 👋'}
              </Text>

              {isUnread && (
                <View
                  style={
                    styles.unreadBadge
                  }
                >
                  <Text
                    style={
                      styles.unreadBadgeText
                    }
                  >
                    {unreadCount > 99
                      ? '99+'
                      : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    };

  /* =======================================================
     MESSAGE ROW
  ======================================================= */

  const threadItems =
    useMemo(
      () =>
        buildThreadItems(
          allMessages[
            selectedConversationId
          ] || []
        ),
      [
        allMessages,
        selectedConversationId,
      ]
    );

  const renderThreadItem =
    ({ item }) => {
      if (item.type === 'date') {
        return (
          <View
            style={
              styles.dateChipWrap
            }
          >
            <View
              style={
                styles.dateChip
              }
            >
              <Text
                style={
                  styles.dateChipText
                }
              >
                {item.label}
              </Text>
            </View>
          </View>
        );
      }

      const {
        msg,
        isFirstInGroup,
        isLastInGroup,
      } = item;

      const sent =
        msg.senderId ===
        myUserId;

      const grouped =
        !isLastInGroup;

      return (
        <View>
          <View
            style={[
              styles.messageRow,

              {
                justifyContent:
                  sent
                    ? 'flex-end'
                    : 'flex-start',
              },
            ]}
          >
            <View
              style={[
                styles.bubble,

                sent
                  ? styles.bubbleSent
                  : styles.bubbleReceived,

                grouped &&
                  (sent
                    ? styles.bubbleSentGrouped
                    : styles.bubbleReceivedGrouped),
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,

                  sent
                    ? styles.bubbleTextSent
                    : styles.bubbleTextReceived,
                ]}
              >
                {msg.messageText}
              </Text>
            </View>
          </View>

          {isLastInGroup && (
            <Text
              style={[
                styles.bubbleTimestamp,

                sent
                  ? styles.bubbleTimestampSent
                  : styles.bubbleTimestampReceived,
              ]}
            >
              {formatBubbleTime(
                msg.dateSent
              )}
            </Text>
          )}
        </View>
      );
    };

  const lastMessage =
    (
      allMessages[
        selectedConversationId
      ] || []
    ).slice(-1)[0];

  const showReadReceipt =
    lastMessage &&
    lastMessage.senderId === myUserId &&
    lastMessage.isRead;

  /* =======================================================
     LOADING SCREEN
  ======================================================= */

  if (
    !fontsLoaded ||
    loading
  ) {
    return (
      <View
        style={[
          styles.safeArea,
          styles.center,

          {
            paddingTop:
              insets.top,

            paddingBottom:
              insets.bottom,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.blue}
        />
      </View>
    );
  }

  /* =======================================================
     THREAD VIEW
  ======================================================= */

  if (
    view === 'thread' &&
    selectedConversation
  ) {
    const name =
      selectedConversation.otherUserName ||
      `User ${selectedConversation.otherUserId}`;

    const initial =
      name
        .charAt(0)
        .toUpperCase();

    return (
      <View
        style={styles.safeArea}
      >
        <KeyboardAvoidingView
          style={styles.flex}

          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : 'height'
          }

          keyboardVerticalOffset={0}
        >

          {/* =============================================
              CHAT HEADER
          ============================================= */}

          <View
            style={[
              styles.threadHeader,

              {
                paddingTop:
                  insets.top + 12,
              },
            ]}
          >
            <TouchableOpacity
              onPress={
                closeThread
              }
              style={
                styles.backButton
              }
              activeOpacity={0.7}
              hitSlop={{
                top: 8,
                bottom: 8,
                left: 8,
                right: 8,
              }}
            >
              <Feather
                name="arrow-left"
                size={22}
                color={
                  COLORS.black
                }
              />
            </TouchableOpacity>

            <View
              style={[
                styles.avatar,

                styles.threadAvatar,

                {
                  backgroundColor:
                    avatarColorFor(
                      selectedConversation.otherUserId
                    ),
                },
              ]}
            >
              <Text
                style={
                  styles.avatarText
                }
              >
                {initial}
              </Text>
            </View>

            <View
              style={{ flex: 1 }}
            >
              <Text
                style={
                  styles.threadName
                }
                numberOfLines={1}
              >
                {name}
              </Text>

              <Text
                style={
                  styles.threadStatus
                }
              >
                {otherOnline
                  ? 'Active now'
                  : 'Offline'}
              </Text>
            </View>
          </View>

          {/* =============================================
              MESSAGE LIST
          ============================================= */}

          {loadingMessages ? (
            <View
              style={[
                styles.flex,
                styles.center,
              ]}
            >
              <ActivityIndicator
                size="large"
                color={
                  COLORS.blue
                }
              />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}

              style={styles.flex}

              data={threadItems}

              keyExtractor={(item) =>
                item.id
              }

              renderItem={
                renderThreadItem
              }

              contentContainerStyle={[
                styles.messagesContent,

                {
                  paddingHorizontal:
                    messageHorizontalPadding,
                },
              ]}

              keyboardShouldPersistTaps="handled"

              keyboardDismissMode={
                Platform.OS === 'ios'
                  ? 'interactive'
                  : 'on-drag'
              }

              automaticallyAdjustKeyboardInsets={
                Platform.OS === 'ios'
              }

              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd(
                  {
                    animated: false,
                  }
                )
              }

              ListEmptyComponent={
                <View
                  style={[
                    styles.center,
                    styles.emptyMessages,
                  ]}
                >
                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    No messages yet.
                    Say hello!
                  </Text>
                </View>
              }

              ListFooterComponent={
                showReadReceipt ? (
                  <View
                    style={
                      styles.readReceiptRow
                    }
                  >
                    <Feather
                      name="check"
                      size={13}
                      color={
                        COLORS.blue
                      }
                    />

                    <Text
                      style={
                        styles.readReceiptText
                      }
                    >
                      Read
                    </Text>
                  </View>
                ) : null
              }
            />
          )}

          {/* =============================================
              MESSAGE INPUT
          ============================================= */}

          <View
            style={[
              styles.inputBar,

              {
                paddingBottom:
                  Math.max(
                    insets.bottom,
                    10
                  ),
              },
            ]}
          >
            <TextInput
              style={
                styles.messageInput
              }

              placeholder="Message"

              placeholderTextColor={
                COLORS.gray400
              }

              value={
                messageInput
              }

              onChangeText={
                setMessageInput
              }

              multiline

              maxLength={4000}

              returnKeyType="send"

              blurOnSubmit={false}

              onSubmitEditing={
                handleSend
              }

              textAlignVertical="center"
            />

            <TouchableOpacity
              activeOpacity={0.75}

              style={[
                styles.sendButton,

                messageInput.trim() &&
                  styles.sendButtonActive,
              ]}

              disabled={
                !messageInput.trim()
              }

              onPress={
                handleSend
              }

              hitSlop={{
                top: 6,
                bottom: 6,
                left: 6,
                right: 6,
              }}
            >
              <Feather
                name="arrow-up"
                size={18}
                color={
                  messageInput.trim()
                    ? COLORS.white
                    : COLORS.gray400
                }
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  /* =======================================================
     CONVERSATION LIST
  ======================================================= */

  return (
    <View
      style={styles.safeArea}
    >

      {/* ===============================================
          MESSAGES HEADER
      =============================================== */}

      <View
        style={[
          styles.listHeader,

          {
            paddingTop:
              insets.top + 12,

            paddingHorizontal:
              horizontalPadding,
          },
        ]}
      >
        <View
          style={
            styles.listHeaderTopRow
          }
        >
          <TouchableOpacity
            onPress={() =>
              navigation.goBack()
            }

            activeOpacity={0.7}

            style={
              styles.backButton
            }

            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >
            <Feather
              name="arrow-left"
              size={22}
              color={
                COLORS.black
              }
            />
          </TouchableOpacity>

          <Text
            style={
              styles.listTitle
            }
          >
            Messages
          </Text>

          {!connected && (
            <ActivityIndicator
              size="small"
              color={
                COLORS.gray400
              }
            />
          )}
        </View>

        {/* SEARCH */}

        <View
          style={
            styles.searchWrap
          }
        >
          <Feather
            name="search"
            size={16}
            color={
              COLORS.gray400
            }
            style={
              styles.searchIcon
            }
          />

          <TextInput
            style={
              styles.searchInput
            }

            placeholder="Search"

            placeholderTextColor={
              COLORS.gray400
            }

            value={
              searchQuery
            }

            onChangeText={
              setSearchQuery
            }

            autoCorrect={false}

            autoCapitalize="none"

            returnKeyType="search"
          />
        </View>
      </View>

      {/* ===============================================
          CONVERSATION LIST
      =============================================== */}

      <FlatList
        data={
          filteredConversations
        }

        keyExtractor={(item) =>
          String(
            item.otherUserId
          )
        }

        renderItem={
          renderConversationRow
        }

        keyboardShouldPersistTaps="handled"

        contentContainerStyle={[
          styles.listContent,

          {
            paddingHorizontal:
              horizontalPadding,

            paddingBottom:
              24 +
              insets.bottom,
          },
        ]}

        ListEmptyComponent={
          <View
            style={[
              styles.center,

              {
                paddingTop: 60,
              },
            ]}
          >
            <Text
              style={
                styles.emptyText
              }
            >
              No conversations yet
            </Text>
          </View>
        }
      />
    </View>
  );
}

/* =========================================================
   FONTS
========================================================= */

const F = {
  regular:
    'DMSans_400Regular',

  medium:
    'DMSans_500Medium',

  bold:
    'DMSans_700Bold',
};

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        COLORS.white,
    },

    flex: {
      flex: 1,
    },

    center: {
      alignItems:
        'center',

      justifyContent:
        'center',
    },

    listHeader: {
      paddingBottom: 10,

      backgroundColor:
        COLORS.white,
    },

    listHeaderTopRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      minHeight: 40,

      marginBottom: 14,
    },

    backButton: {
      width: 36,
      height: 36,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 4,
    },

    listTitle: {
      flex: 1,

      minWidth: 0,

      fontFamily:
        F.bold,

      fontSize: 26,

      lineHeight: 32,

      color:
        COLORS.black,
    },

    searchWrap: {
      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        COLORS.gray100,

      borderRadius: 12,

      paddingHorizontal: 12,

      height: 42,
    },

    searchIcon: {
      marginRight: 8,
    },

    searchInput: {
      flex: 1,

      minWidth: 0,

      height: 42,

      fontFamily:
        F.regular,

      fontSize: 15,

      color:
        COLORS.black,

      paddingVertical: 0,
    },

    listContent: {
      flexGrow: 1,

      backgroundColor:
        COLORS.backdrop,

      paddingBottom: 24,
    },

    row: {
      flexDirection:
        'row',

      alignItems:
        'center',

      paddingVertical: 14,
    },

    avatarWrap: {
      marginRight: 14,
    },

    avatar: {
      width: 52,
      height: 52,

      borderRadius: 26,

      alignItems:
        'center',

      justifyContent:
        'center',

      flexShrink: 0,
    },

    avatarText: {
      fontFamily:
        F.bold,

      fontSize: 19,

      color:
        COLORS.white,
    },

    rowContent: {
      flex: 1,

      minWidth: 0,
    },

    rowTopLine: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom: 3,

      minWidth: 0,
    },

    rowName: {
      flex: 1,

      minWidth: 0,

      fontFamily:
        F.medium,

      fontSize: 16,

      color:
        COLORS.black,

      marginRight: 10,
    },

    rowNameUnread: {
      fontFamily:
        F.bold,
    },

    rowTime: {
      flexShrink: 0,

      fontFamily:
        F.regular,

      fontSize: 13,

      color:
        COLORS.gray400,
    },

    rowTimeUnread: {
      fontFamily:
        F.bold,

      color:
        COLORS.blue,
    },

    rowBottomLine: {
      flexDirection:
        'row',

      alignItems:
        'center',

      minWidth: 0,
    },

    rowPreview: {
      flex: 1,

      minWidth: 0,

      fontFamily:
        F.regular,

      fontSize: 14,

      color:
        COLORS.gray500,
    },

    unreadBadge: {
      minWidth: 20,
      height: 20,

      borderRadius: 10,

      backgroundColor:
        COLORS.blue,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal: 5,

      marginLeft: 8,

      flexShrink: 0,
    },

    unreadBadgeText: {
      fontFamily:
        F.bold,

      fontSize: 11,

      color:
        COLORS.white,
    },

    threadHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal: 16,

      paddingBottom: 12,

      minHeight: 60,

      backgroundColor:
        COLORS.white,

      borderBottomWidth: 1,

      borderBottomColor:
        COLORS.gray100,
    },

    threadAvatar: {
      width: 36,
      height: 36,

      borderRadius: 18,

      marginLeft: 4,

      marginRight: 12,
    },

    threadName: {
      flex: 1,

      minWidth: 0,

      fontFamily:
        F.bold,

      fontSize: 17,

      color:
        COLORS.black,
    },

    threadStatus: {
      fontFamily:
        F.regular,

      fontSize: 12,

      color:
        COLORS.gray400,

      marginTop: 1,
    },

    messagesContent: {
      flexGrow: 1,

      paddingTop: 16,

      paddingBottom: 16,

      backgroundColor:
        COLORS.backdrop,
    },

    dateChipWrap: {
      alignItems:
        'center',

      marginVertical: 12,
    },

    dateChip: {
      backgroundColor:
        COLORS.gray100,

      borderRadius: 12,

      paddingHorizontal: 12,

      paddingVertical: 5,
    },

    dateChipText: {
      fontFamily:
        F.medium,

      fontSize: 12,

      color:
        COLORS.gray500,
    },

    messageRow: {
      flexDirection:
        'row',

      marginBottom: 6,
    },

    bubble: {
      maxWidth: '82%',

      paddingHorizontal: 16,

      paddingVertical: 10,

      borderRadius: 20,
    },

    bubbleSent: {
      backgroundColor:
        COLORS.blue,

      borderBottomRightRadius: 6,
    },

    bubbleReceived: {
      backgroundColor:
        COLORS.gray100,

      borderBottomLeftRadius: 6,
    },

    bubbleSentGrouped: {
      borderBottomRightRadius: 20,
    },

    bubbleReceivedGrouped: {
      borderBottomLeftRadius: 20,
    },

    bubbleText: {
      fontFamily:
        F.regular,

      fontSize: 15,

      lineHeight: 21,
    },

    bubbleTextSent: {
      color:
        COLORS.white,
    },

    bubbleTextReceived: {
      color:
        COLORS.black,
    },

    bubbleTimestamp: {
      fontFamily:
        F.regular,

      fontSize: 11,

      color:
        COLORS.gray400,

      marginTop: 3,

      marginBottom: 6,
    },

    bubbleTimestampSent: {
      textAlign:
        'right',

      marginRight: 4,
    },

    bubbleTimestampReceived: {
      textAlign:
        'left',

      marginLeft: 4,
    },

    readReceiptRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'flex-end',

      paddingRight: 4,

      paddingTop: 2,

      gap: 4,
    },

    readReceiptText: {
      fontFamily:
        F.regular,

      fontSize: 11,

      color:
        COLORS.gray500,
    },

    emptyMessages: {
      flex: 1,

      minHeight: 200,
    },

    emptyText: {
      fontFamily:
        F.regular,

      fontSize: 14,

      color:
        COLORS.gray400,
    },

    inputBar: {
      flexDirection:
        'row',

      alignItems:
        'flex-end',

      paddingHorizontal: 16,

      paddingTop: 10,

      backgroundColor:
        COLORS.white,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.gray100,
    },

    messageInput: {
      flex: 1,

      minWidth: 0,

      minHeight: 40,

      maxHeight: 110,

      backgroundColor:
        COLORS.gray100,

      borderRadius: 20,

      paddingHorizontal: 16,

      paddingTop: 10,

      paddingBottom: 10,

      fontFamily:
        F.regular,

      fontSize: 15,

      lineHeight: 21,

      color:
        COLORS.black,

      marginRight: 8,
    },

    sendButton: {
      width: 40,
      height: 40,

      borderRadius: 20,

      backgroundColor:
        COLORS.gray300,

      alignItems:
        'center',

      justifyContent:
        'center',

      flexShrink: 0,
    },

    sendButtonActive: {
      backgroundColor:
        COLORS.blue,
    },
  });