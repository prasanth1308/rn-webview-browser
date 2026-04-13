import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useInAppNotification } from './use-in-app-notification';
import { useSettings } from './use-settings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type UseNotificationsResult = {
  expoPushToken: string | null;
  permissionGranted: boolean;
};

export function useNotifications(): UseNotificationsResult {
  const [expoPushToken, setLocalToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { showNotification } = useInAppNotification();
  const { setExpoPushToken } = useSettings();

  const receivedListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotifications();

    receivedListener.current = Notifications.addNotificationReceivedListener(notification => {
      const title = notification.request.content.title ?? 'New notification';
      showNotification(title, 'info');
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // Handle tap on notification — navigate or take action here in the future
    });

    return () => {
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('[Notifications] Push notifications require a physical device.');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted.');
      return;
    }

    setPermissionGranted(true);

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      setLocalToken(tokenData.data);
      setExpoPushToken(tokenData.data);
    } catch (err) {
      console.warn('[Notifications] Failed to get push token:', err);
    }
  }

  return { expoPushToken, permissionGranted };
}
