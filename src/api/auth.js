import api from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectChatSession, disconnectChatSession } from './chat';

export async function login(email, password) {
  const { data } = await api.post('/api/User/login', { email, password });

  await AsyncStorage.multiSet([
    ['token', data.token],
    ['userId', String(data.userId)],
    ['role', data.role],
  ]);

  connectChatSession();

  return data;
}

export async function register(payload) {
  const { data } = await api.post('/api/User/register', payload);

  // Under-18 athlete signups return { status: 'PendingParentConsent', message }
  // instead of a real token — nothing to log in with yet, so don't touch
  // AsyncStorage or start a chat session.
  if (!data.token) {
    return data;
  }

  await AsyncStorage.multiSet([
    ['token', data.token],
    ['userId', String(data.userId)],
    ['role', data.role],
  ]);

  connectChatSession();

  return data;
}

export async function logout() {
  disconnectChatSession();
  await AsyncStorage.multiRemove(['token', 'userId', 'role']);

  
}