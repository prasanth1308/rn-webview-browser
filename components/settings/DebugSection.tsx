import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettings } from '@/hooks/use-settings';

export function DebugSection() {
  const { clearWebViewCache } = useSettings();

  function handleClearCache() {
    Alert.alert('Clear Cache', 'Clear WebView cache and cookies?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: clearWebViewCache,
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Debug</Text>
      <View style={styles.card}>
        <Pressable style={styles.row} onPress={handleClearCache}>
          <Text style={styles.label}>Clear WebView Cache</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
  },
});
