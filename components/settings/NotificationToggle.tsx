import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { useSettings } from '@/hooks/use-settings';

export function NotificationToggle() {
  const { notificationEnabled, setNotificationEnabled, expoPushToken } = useSettings();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.labelGroup}>
            <Text style={styles.label}>Push Notifications</Text>
            <Text style={styles.sublabel}>Receive alerts when away from the app</Text>
          </View>
          <Switch
            value={notificationEnabled}
            onValueChange={setNotificationEnabled}
            trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
            thumbColor="#fff"
          />
        </View>
        {notificationEnabled && expoPushToken ? (
          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>Device Token</Text>
            <Text style={styles.tokenValue} numberOfLines={2} selectable>
              {expoPushToken}
            </Text>
          </View>
        ) : null}
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
    padding: 14,
    gap: 12,
  },
  labelGroup: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  sublabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tokenBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    padding: 14,
    gap: 4,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tokenValue: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
});
