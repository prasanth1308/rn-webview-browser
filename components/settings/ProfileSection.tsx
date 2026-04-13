import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useSettings } from '@/hooks/use-settings';

export function ProfileSection() {
  const { profile, setProfile } = useSettings();
  const [name, setName] = useState(profile.name);

  function handleBlur() {
    if (name.trim() !== profile.name) {
      setProfile({ name: name.trim() });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Profile</Text>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.trim() ? name.trim()[0].toUpperCase() : '?'}
          </Text>
        </View>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          onBlur={handleBlur}
          placeholder="Enter your name"
          placeholderTextColor="#9CA3AF"
          returnKeyType="done"
        />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
});
