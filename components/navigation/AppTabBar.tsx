import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavTab } from '@/constants/defaults';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { TabIcon } from './TabIcon';

type Props = {
  tabs: NavTab[];
  activeId: string;
  onTabPress: (tab: NavTab) => void;
};

export const TAB_BAR_HEIGHT = 56;

export function AppTabBar({ tabs, activeId, onTabPress }: Props) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const activeColor = Colors[colorScheme].tint;
  const inactiveColor = Colors[colorScheme].tabIconDefault;
  const bgColor = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          backgroundColor: bgColor,
        },
      ]}>
      <View style={styles.separator} />
      <View style={styles.row}>
        {tabs.map(tab => {
          const isActive = tab.id === activeId;
          const color = isActive ? activeColor : inactiveColor;

          return (
            <Pressable
              key={tab.id}
              style={styles.tab}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onTabPress(tab);
              }}
              accessibilityRole="button"
              accessibilityLabel={tab.name}
              accessibilityState={{ selected: isActive }}>
              <TabIcon icon={tab.icon} name={tab.name} size={24} color={color} />
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
