import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { WebViewNavigation } from 'react-native-webview';

import { BrowserBar } from '@/components/browser/BrowserBar';
import { ProgressBar } from '@/components/browser/ProgressBar';
import { useInAppNotification } from '@/hooks/use-in-app-notification';
import { useSettings } from '@/hooks/use-settings';

export default function BrowserScreen() {
  const { presetUrls, homeUrl, clearCacheSignal, isLoaded } = useSettings();
  const { showNotification } = useInAppNotification();

  const [currentUrl, setCurrentUrl] = useState(homeUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const webViewRef = useRef<WebView>(null);

  // Update initial URL once settings are loaded from storage
  useEffect(() => {
    if (isLoaded) {
      setCurrentUrl(homeUrl);
    }
  }, [isLoaded, homeUrl]);

  // Respond to clear cache signal from Settings
  useEffect(() => {
    if (clearCacheSignal > 0 && webViewRef.current) {
      webViewRef.current.clearCache(true);
      showNotification('Cache cleared', 'success');
    }
  }, [clearCacheSignal, showNotification]);

  function handleNavigationStateChange(navState: WebViewNavigation) {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    if (navState.url) setCurrentUrl(navState.url);
  }

  // WebView is not supported on web platform
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <BrowserBar
          url={currentUrl}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          presetUrls={presetUrls}
          onBack={() => webViewRef.current?.goBack()}
          onForward={() => webViewRef.current?.goForward()}
          onReload={() => webViewRef.current?.reload()}
          onHome={() => setCurrentUrl(homeUrl)}
          onBookmarkSelect={url => setCurrentUrl(url)}
        />
        <View style={styles.webviewContainer}>
          <ProgressBar progress={loadingProgress} visible={isLoading} />
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webview}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadProgress={({ nativeEvent }) =>
              setLoadingProgress(nativeEvent.progress)
            }
            onLoadStart={() => {
              setIsLoading(true);
              setLoadingProgress(0);
            }}
            onLoadEnd={() => {
              setIsLoading(false);
              setLoadingProgress(1);
            }}
            allowsBackForwardNavigationGestures
            sharedCookiesEnabled
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
});
