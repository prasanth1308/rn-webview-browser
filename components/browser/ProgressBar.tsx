import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  progress: number;
  visible: boolean;
};

export function ProgressBar({ progress, visible }: Props) {
  const colorScheme = useColorScheme();
  const width = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 150 });
    } else {
      // Brief delay so user sees 100% before hiding
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, opacity]);

  useEffect(() => {
    width.value = withTiming(progress * 100, { duration: 150 });
  }, [progress, width]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as `${number}%`,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: Colors[colorScheme ?? 'light'].tint },
        barStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 3,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
});
