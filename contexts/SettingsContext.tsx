import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  DEFAULT_BASE_URL,
  DEFAULT_LOGIN_PATH,
  DEFAULT_TABS,
  NavTab,
  STORAGE_KEYS,
} from '@/constants/defaults';

export type UserProfile = { name: string };

type SettingsState = {
  baseUrl: string;
  loginPath: string;
  notificationEnabled: boolean;
  profile: UserProfile;
  clearCacheSignal: number;
  logoutSignal: number;
  isLoaded: boolean;
  expoPushToken: string | null;
};

type SettingsContextValue = SettingsState & {
  tabs: NavTab[];
  setBaseUrl: (url: string) => Promise<void>;
  setLoginPath: (path: string) => Promise<void>;
  setNotificationEnabled: (enabled: boolean) => Promise<void>;
  setProfile: (profile: UserProfile) => Promise<void>;
  clearWebViewCache: () => void;
  logout: () => void;
  setExpoPushToken: (token: string) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>({
    baseUrl: DEFAULT_BASE_URL,
    loginPath: DEFAULT_LOGIN_PATH,
    notificationEnabled: false,
    profile: { name: '' },
    clearCacheSignal: 0,
    logoutSignal: 0,
    isLoaded: false,
    expoPushToken: null,
  });

  useEffect(() => {
    async function load() {
      const [rawBaseUrl, rawLoginPath, rawEnabled, rawProfile] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BASE_URL),
        AsyncStorage.getItem(STORAGE_KEYS.LOGIN_PATH),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
      ]);
      setState(prev => ({
        ...prev,
        baseUrl:            rawBaseUrl   ?? DEFAULT_BASE_URL,
        loginPath:          rawLoginPath ?? DEFAULT_LOGIN_PATH,
        notificationEnabled: rawEnabled === 'true',
        profile:            rawProfile ? JSON.parse(rawProfile) : { name: '' },
        isLoaded:           true,
      }));
    }
    load();
  }, []);

  const setBaseUrl = useCallback(async (url: string) => {
    const trimmed = url.trim();
    await AsyncStorage.setItem(STORAGE_KEYS.BASE_URL, trimmed);
    setState(prev => ({ ...prev, baseUrl: trimmed }));
  }, []);

  const setLoginPath = useCallback(async (path: string) => {
    const trimmed = path.trim();
    await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_PATH, trimmed);
    setState(prev => ({ ...prev, loginPath: trimmed }));
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

  const logout = useCallback(() => {
    setState(prev => ({ ...prev, logoutSignal: prev.logoutSignal + 1 }));
  }, []);

  const setExpoPushToken = useCallback((token: string) => {
    setState(prev => ({ ...prev, expoPushToken: token }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        ...state,
        tabs: DEFAULT_TABS,
        setBaseUrl,
        setLoginPath,
        setNotificationEnabled,
        setProfile,
        clearWebViewCache,
        logout,
        setExpoPushToken,
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
