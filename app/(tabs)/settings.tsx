import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClearCacheRow } from '@/components/settings/ClearCacheRow';
import { NotificationToggle } from '@/components/settings/NotificationToggle';
import { PresetUrlsManager } from '@/components/settings/PresetUrlsManager';
import { ProfileSection } from '@/components/settings/ProfileSection';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <ProfileSection />
        <NotificationToggle />
        <PresetUrlsManager />
        <ClearCacheRow />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
