import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useSettings } from '@/hooks/use-settings';

type Props = {
  onLogout?: () => void;
};

export function LogoutSection({ onLogout }: Props) {
  const { logout } = useSettings();

  function handlePress() {
    Alert.alert(
      'Log Out',
      'Your session will be cleared and you will return to the login screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();       // signals context → app/index.tsx handles WebView ops
            onLogout?.();   // close settings overlay
          },
        },
      ],
    );
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.8}>
      <Text style={styles.label}>Log Out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
