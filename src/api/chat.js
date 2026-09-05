import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';

let connection = null;
let connectingPromise = null;

const messageListeners = new Set();
const readListeners = new Set();

/*
 * Ensures a single, shared connection exists for the whole app
 * session. Safe to call many times — if a connection is already
 * up (or already connecting), it's reused instead of restarted.
 * This is what prevents the "stop() called before start()
 * finished" race that happens when connect/disconnect are tied
 * to a single screen's mount/unmount.
 */
async function ensureConnected() {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    const token = await AsyncStorage.getItem('token');
    const baseUrl = process.env.EXPO_PUBLIC_API_URL;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/chat`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    conn.on('ReceiveMessage', (dto) => {
      messageListeners.forEach((cb) => cb(dto));
    });

    conn.on('MessagesRead', (readerUserId) => {
      readListeners.forEach((cb) => cb(readerUserId));
    });

    await conn.start();

    connection = conn;
    connectingPromise = null;
    return conn;
  })();

  return connectingPromise;
}

/*
 * Call this ONCE, right after a successful login/registration —
 * not from individual screens. Keeps the socket alive for the
 * whole session, not just while a particular screen is mounted.
 */
export function connectChatSession() {
  return ensureConnected().catch((err) => {
    console.error('Chat connect failed:', err);
  });
}

/*
 * Screens subscribe to incoming events without owning the
 * connection itself. Returns an unsubscribe function — safe to
 * call on unmount, no network activity involved.
 */
export function addMessageListener(callback) {
  messageListeners.add(callback);
  return () => messageListeners.delete(callback);
}

export function addReadListener(callback) {
  readListeners.add(callback);
  return () => readListeners.delete(callback);
}

export async function sendChatMessage(receiverId, messageText) {
  const conn = await ensureConnected();
  return conn.invoke('SendMessage', receiverId, messageText);
}

export async function markThreadAsRead(otherUserId) {
  const conn = await ensureConnected();
  return conn.invoke('MarkThreadAsRead', otherUserId);
}

export async function checkOnline(userId) {
  const conn = await ensureConnected();
  return conn.invoke('IsOnline', userId);
}

export function isChatConnected() {
  return connection?.state === signalR.HubConnectionState.Connected;
}

/*
 * Call this ONLY on logout — not when leaving the Messages screen.
 */
export function disconnectChatSession() {
  connection?.stop();
  connection = null;
  connectingPromise = null;
  messageListeners.clear();
  readListeners.clear();
}