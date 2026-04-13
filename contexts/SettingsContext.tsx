import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { DEFAULT_HOME_URL, DEFAULT_PRESET_URLS, STORAGE_KEYS } from '@/constants/defaults';

export type PresetUrl = { label: string; url: string };
export type UserProfile = { name: string };

type SettingsState = {
  presetUrls: PresetUrl[];
  notificationEnabled: boolean;
  profile: UserProfile;
  clearCacheSignal: number;
  isLoaded: boolean;
  expoPushToken: string | null;
};

type SettingsContextValue = SettingsState & {
  addPresetUrl: (entry: PresetUrl) => Promise<void>;
  removePresetUrl: (url: string) => Promise<void>;
  setNotificationEnabled: (enabled: boolean) => Promise<void>;
  setProfile: (profile: UserProfile) => Promise<void>;
  clearWebViewCache: () => void;
  setExpoPushToken: (token: string) => void;
  homeUrl: string;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>({
    presetUrls: DEFAULT_PRESET_URLS,
    notificationEnabled: false,
    profile: { name: '' },
    clearCacheSignal: 0,
    isLoaded: false,
    expoPushToken: null,
  });

  useEffect(() => {
    async function load() {
      const [rawUrls, rawEnabled, rawProfile] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PRESET_URLS),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
      ]);

      setState(prev => ({
        ...prev,
        presetUrls: rawUrls ? JSON.parse(rawUrls) : DEFAULT_PRESET_URLS,
        notificationEnabled: rawEnabled === 'true',
        profile: rawProfile ? JSON.parse(rawProfile) : { name: '' },
        isLoaded: true,
      }));
    }
    load();
  }, []);

  const addPresetUrl = useCallback(async (entry: PresetUrl) => {
    setState(prev => {
      const next = [...prev.presetUrls, entry];
      AsyncStorage.setItem(STORAGE_KEYS.PRESET_URLS, JSON.stringify(next));
      return { ...prev, presetUrls: next };
    });
  }, []);

  const removePresetUrl = useCallback(async (url: string) => {
    setState(prev => {
      const next = prev.presetUrls.filter(p => p.url !== url);
      AsyncStorage.setItem(STORAGE_KEYS.PRESET_URLS, JSON.stringify(next));
      return { ...prev, presetUrls: next };
    });
  }, []);

  const setNotificationEnabled = useCallback(async (enabled: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_ENABLED, String(enabled));
    setState(prev => ({ ...prev, notificationEnabled: enabled }));
  }, []);

  const setProfile = useCallback(async (profile: UserProfile) => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    setState(prev => ({ ...prev, profile }));
  }, []);

  const clearWebViewCache = useCallback(() => {
    setState(prev => ({ ...prev, clearCacheSignal: prev.clearCacheSignal + 1 }));
  }, []);

  const setExpoPushToken = useCallback((token: string) => {
    setState(prev => ({ ...prev, expoPushToken: token }));
  }, []);

  const homeUrl = state.presetUrls[0]?.url ?? DEFAULT_HOME_URL;

  return (
    <SettingsContext.Provider
      value={{
        ...state,
        addPresetUrl,
        removePresetUrl,
        setNotificationEnabled,
        setProfile,
        clearWebViewCache,
        setExpoPushToken,
        homeUrl,
      }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used within SettingsProvider');
  return ctx;
}
