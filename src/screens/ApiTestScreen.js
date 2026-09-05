import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';

export default function ApiTestScreen() {
  const [baseUrl, setBaseUrl] = useState('https://bbbd-102-32-127-135.ngrok-free.app');
  const [log, setLog] = useState([]);

  function addLog(message) {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  }

  async function testConnection() {
    addLog('Attempting to reach: ' + baseUrl + '/swagger/index.html');
    try {
      const response = await fetch(baseUrl + '/swagger/index.html');
      addLog('Response status: ' + response.status);
      if (response.ok) {
        addLog('✅ SUCCESS — API is reachable!');
      } else {
        addLog('⚠️ Got a response, but status was not OK.');
      }
    } catch (error) {
      addLog('❌ FAILED: ' + error.message);
    }
  }

  async function testLogin() {
    addLog('Trying POST ' + baseUrl + '/api/User/login');
    try {
      const response = await fetch(baseUrl + '/api/User/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'Messi@Scout.com',
          password: 'Messi1234',
        }),
      });
      const text = await response.text();
      addLog('Login response status: ' + response.status);
      addLog('Body: ' + text);
    } catch (error) {
      addLog('❌ Login request FAILED: ' + error.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>

      <Text style={styles.label}>Base URL:</Text>
      <TextInput
        style={styles.input}
        value={baseUrl}
        onChangeText={setBaseUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.buttonRow}>
        <Button title="Test Connection" onPress={testConnection} />
        <Button title="Test Login" onPress={testLogin} />
      </View>

      <ScrollView style={styles.log}>
        {log.map((line, i) => (
          <Text key={i} style={styles.logLine}>{line}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  label: { fontSize: 14, color: '#555', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  log: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#fafafa',
  },
  logLine: { fontSize: 12, marginBottom: 4, fontFamily: 'monospace' },
});