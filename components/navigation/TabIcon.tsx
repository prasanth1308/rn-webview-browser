import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

type Props = {
  icon?: string;
  name: string;
  size?: number;
  color: string;
};

export function TabIcon({ icon, name, size = 24, color }: Props) {
  if (icon) {
    return (
      <IconSymbol
        // cast needed: Android MAPPING is a narrow union; iOS accepts any SF Symbol string
        name={icon as any}
        size={size}
        color={color}
      />
    );
  }

  // No icon configured → show first character of name in a rounded-rect badge
  const letter = name.charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          borderColor: color,
        },
      ]}>
      <Text style={[styles.letter, { color, fontSize: size * 0.55 }]}>
        {letter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: '700',
    includeFontPadding: false,
  },
});
