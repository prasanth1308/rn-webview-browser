import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { WebViewNavigation } from 'react-native-webview';

import { ProgressBar } from '@/components/browser/ProgressBar';
import { AppTabBar, TAB_BAR_HEIGHT } from '@/components/navigation/AppTabBar';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { DEFAULT_TABS, NavTab, SETTINGS_TAB } from '@/constants/defaults';
import { useInAppNotification } from '@/hooks/use-in-app-notification';
import { useSettings } from '@/hooks/use-settings';

const ALL_TABS: NavTab[] = [...DEFAULT_TABS, SETTINGS_TAB];

export default function MainScreen() {
  const {
    baseUrl,
    loginPath,
    isLoaded,
    clearCacheSignal,
    logoutSignal,
  } = useSettings();

  const { showNotification } = useInAppNotification();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTabId, setActiveTabId] = useState(DEFAULT_TABS[0].id);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Seed initial URL once AsyncStorage has loaded
  useEffect(() => {
    if (isLoaded && webViewUrl === '') {
      setWebViewUrl(baseUrl + loginPath);
    }
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // If URL config changes while not yet logged in, update the login page URL
  useEffect(() => {
    if (isLoaded && !isLoggedIn) {
      setWebViewUrl(baseUrl + loginPath);
    }
  }, [baseUrl, loginPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear WebView cache and cookies on demand (from debug settings)
  useEffect(() => {
    if (clearCacheSignal > 0) {
      const wv = webViewRef.current as any;
      wv?.clearCache?.(true);
      // Clear non-HttpOnly cookies via JS injection
      webViewRef.current?.injectJavaScript(
        `document.cookie.split(';').forEach(c => {
          document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/');
        }); true;`,
      );
      showNotification('Cache & cookies cleared', 'success');
    }
  }, [clearCacheSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Perform logout when context signals it
  useEffect(() => {
    if (logoutSignal > 0) {
      handleLogout();
    }
  }, [logoutSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply bottom padding immediately when login state changes (injectedJavaScript
  // only fires on page load, so we need an imperative call for the current page)
  useEffect(() => {
    const height = isLoggedIn ? TAB_BAR_HEIGHT + insets.bottom : 0;
    webViewRef.current?.injectJavaScript(
      `document.body.style.paddingBottom = '${height}px'; true;`,
    );
  }, [isLoggedIn, insets.bottom]);

  const handleLogout = useCallback(() => {
    const wv = webViewRef.current as any;
    wv?.clearCache?.(true);
    setIsLoggedIn(false);
    setActiveTabId(DEFAULT_TABS[0].id);
    setWebViewUrl(baseUrl + loginPath);
  }, [baseUrl, loginPath]);

  function handleNavigationStateChange(navState: WebViewNavigation) {
    if (!navState.url) return;

    try {
      const pathname = new URL(navState.url).pathname;
      // Normalize empty loginPath to "/" (root)
      const normalizedLogin = loginPath || '/';
      const onLoginPage =
        normalizedLogin === '/'
          ? pathname === '/' || pathname === ''
          : pathname === normalizedLogin || pathname.startsWith(normalizedLogin + '/');
      const onOurSite = navState.url.startsWith(baseUrl);

      if (!isLoggedIn && onOurSite && !onLoginPage) {
        setIsLoggedIn(true);
      }

      // Server-side logout: web app redirected back to login
      if (isLoggedIn && onOurSite && onLoginPage) {
        setIsLoggedIn(false);
        setActiveTabId(DEFAULT_TABS[0].id);
      }
    } catch {
      // URL parsing failed — ignore
    }
  }

  function handleTabPress(tab: NavTab) {
    if (tab.id === 'settings') {
      setActiveTabId('settings');
      return;
    }
    setActiveTabId(tab.id);
    const targetUrl = baseUrl + tab.path;
    webViewRef.current?.injectJavaScript(
      `window.location.href = ${JSON.stringify(targetUrl)}; true;`,
    );
  }

  // Inject bottom padding so page content isn't hidden under the tab bar
  const tabBarTotalHeight = TAB_BAR_HEIGHT + insets.bottom;
  const injectedCSS = isLoggedIn
    ? `document.body.style.paddingBottom = '${tabBarTotalHeight}px'; true;`
    : `document.body.style.paddingBottom = '0px'; true;`;

  if (Platform.OS === 'web') return null;
  if (!isLoaded) return null;

  const showSettings = activeTabId === 'settings';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <WebView
        ref={webViewRef}
        source={{ uri: webViewUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadProgress={({ nativeEvent }) => setLoadingProgress(nativeEvent.progress)}
        onLoadStart={() => { setIsLoading(true); setLoadingProgress(0); }}
        onLoadEnd={() => { setIsLoading(false); setLoadingProgress(1); }}
        injectedJavaScript={injectedCSS}
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
      />

      <ProgressBar visible={isLoading} progress={loadingProgress} />

      {showSettings && (
        <View style={styles.overlay}>
          <SettingsScreen onLogout={() => setActiveTabId(DEFAULT_TABS[0].id)} />
        </View>
      )}

      {isLoggedIn && (
        <AppTabBar
          tabs={ALL_TABS}
          activeId={activeTabId}
          onTabPress={handleTabPress}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});
