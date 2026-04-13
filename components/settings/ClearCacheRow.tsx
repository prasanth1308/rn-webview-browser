import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useInAppNotification } from '@/hooks/use-in-app-notification';
import { useSettings } from '@/hooks/use-settings';

export function ClearCacheRow() {
  const { clearWebViewCache } = useSettings();
  const { showNotification } = useInAppNotification();

  function handlePress() {
    Alert.alert('Clear Cache', 'Clear all browser cache and cookies?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearWebViewCache();
          showNotification('Browser cache cleared', 'success');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Data</Text>
      <TouchableOpacity style={styles.card} onPress={handlePress}>
        <Text style={styles.label}>Clear Browser Cache</Text>
        <Text style={styles.sublabel}>Removes cookies and cached data</Text>
      </TouchableOpacity>
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
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#DC2626',
  },
  sublabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
