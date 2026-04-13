import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PresetUrl } from '@/contexts/SettingsContext';

type Props = {
  visible: boolean;
  presetUrls: PresetUrl[];
  onSelect: (url: string) => void;
  onClose: () => void;
};

export function BookmarkPicker({ visible, presetUrls, onSelect, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.handle} />
        <Text style={styles.title}>Open URL</Text>
        {presetUrls.map((item, index) => (
          <TouchableOpacity
            key={item.url}
            style={[styles.item, index > 0 && styles.borderTop]}
            onPress={() => {
              onSelect(item.url);
              onClose();
            }}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={styles.itemUrl} numberOfLines={1}>
              {item.url}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.item, styles.borderTop, styles.cancelItem]} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  item: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 2,
  },
  borderTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  itemUrl: {
    fontSize: 12,
    color: '#6B7280',
  },
  cancelItem: {
    alignItems: 'center',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
