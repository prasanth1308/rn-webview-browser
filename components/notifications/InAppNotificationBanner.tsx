import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { SlideInDown, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { InAppNotification, NotificationType } from '@/contexts/InAppNotificationContext';

const BG: Record<NotificationType, string> = {
  info: '#2563EB',
  success: '#16A34A',
  error: '#DC2626',
};

type Props = {
  notification: InAppNotification | null;
};

export function InAppNotificationBanner({ notification }: Props) {
  const insets = useSafeAreaInsets();

  if (!notification) return null;

  return (
    <Animated.View
      key={notification.id}
      entering={SlideInDown.springify().damping(15)}
      exiting={SlideOutUp.duration(250)}
      style={[
        styles.banner,
        { backgroundColor: BG[notification.type], top: insets.top + 8 },
      ]}>
      <Text style={styles.text}>{notification.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
