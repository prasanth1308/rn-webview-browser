import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import type { PresetUrl } from '@/contexts/SettingsContext';

import { BookmarkPicker } from './BookmarkPicker';

type Props = {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  presetUrls: PresetUrl[];
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onBookmarkSelect: (url: string) => void;
};

export function BrowserBar({
  url,
  canGoBack,
  canGoForward,
  presetUrls,
  onBack,
  onForward,
  onReload,
  onHome,
  onBookmarkSelect,
}: Props) {
  const [pickerVisible, setPickerVisible] = useState(false);

  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <>
      <View style={styles.bar}>
        <TouchableOpacity
          style={[styles.navBtn, !canGoBack && styles.disabled]}
          onPress={onBack}
          disabled={!canGoBack}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <IconSymbol name="chevron.left" size={22} color={canGoBack ? '#111827' : '#D1D5DB'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, !canGoForward && styles.disabled]}
          onPress={onForward}
          disabled={!canGoForward}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <IconSymbol name="chevron.right" size={22} color={canGoForward ? '#111827' : '#D1D5DB'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.urlBar}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.7}>
          <Text style={styles.urlText} numberOfLines={1}>
            {displayUrl}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onReload}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <IconSymbol name="arrow.clockwise" size={20} color="#111827" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onHome}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <IconSymbol name="bookmark.fill" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <BookmarkPicker
        visible={pickerVisible}
        presetUrls={presetUrls}
        onSelect={onBookmarkSelect}
        onClose={() => setPickerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  navBtn: {
    padding: 4,
  },
  disabled: {
    opacity: 0.4,
  },
  urlBar: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  urlText: {
    fontSize: 13,
    color: '#374151',
  },
});
