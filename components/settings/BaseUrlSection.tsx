import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useSettings } from '@/hooks/use-settings';

export function BaseUrlSection() {
  const { baseUrl, loginPath, setBaseUrl, setLoginPath } = useSettings();
  const [localBase, setLocalBase] = useState(baseUrl);
  const [localLogin, setLocalLogin] = useState(loginPath);

  // Sync if context values update externally
  useEffect(() => { setLocalBase(baseUrl); }, [baseUrl]);
  useEffect(() => { setLocalLogin(loginPath); }, [loginPath]);

  function handleBaseBlur() {
    const trimmed = localBase.trim();
    if (trimmed === baseUrl) return;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      setBaseUrl(trimmed);
    } else {
      setLocalBase(baseUrl); // revert invalid input
    }
  }

  function handleLoginBlur() {
    const trimmed = localLogin.trim();
    if (trimmed === loginPath) return;
    const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    setLoginPath(normalized);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Server</Text>
      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Base URL</Text>
          <TextInput
            style={styles.input}
            value={localBase}
            onChangeText={setLocalBase}
            onBlur={handleBaseBlur}
            placeholder="https://example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>
        <View style={[styles.field, styles.borderTop]}>
          <Text style={styles.fieldLabel}>Login Path</Text>
          <TextInput
            style={styles.input}
            value={localLogin}
            onChangeText={setLocalLogin}
            onBlur={handleLoginBlur}
            placeholder="/login"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  field: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  borderTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    fontSize: 15,
    color: '#111827',
    paddingVertical: 2,
  },
});
