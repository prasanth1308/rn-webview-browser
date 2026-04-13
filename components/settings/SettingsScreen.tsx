import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationToggle } from '@/components/settings/NotificationToggle';
import { ProfileSection } from '@/components/settings/ProfileSection';

import { BaseUrlSection } from './BaseUrlSection';
import { DebugSection } from './DebugSection';
import { LogoutSection } from './LogoutSection';

type Props = {
  onLogout?: () => void;
};

export function SettingsScreen({ onLogout }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Text style={styles.title}>Settings</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <LogoutSection onLogout={onLogout} />
        <BaseUrlSection />
        <ProfileSection />
        <NotificationToggle />
        {__DEV__ && <DebugSection />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
});
