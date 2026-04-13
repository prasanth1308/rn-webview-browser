import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSettings } from '@/hooks/use-settings';

export function PresetUrlsManager() {
  const { presetUrls, addPresetUrl, removePresetUrl } = useSettings();
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  function handleAdd() {
    const trimmedUrl = url.trim();
    const trimmedLabel = label.trim();
    if (!trimmedLabel || !trimmedUrl) return;
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      Alert.alert('Invalid URL', 'URL must start with http:// or https://');
      return;
    }
    addPresetUrl({ label: trimmedLabel, url: trimmedUrl });
    setLabel('');
    setUrl('');
    setShowAdd(false);
  }

  function handleRemove(urlToRemove: string) {
    Alert.alert('Remove URL', 'Remove this preset URL?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removePresetUrl(urlToRemove) },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Preset URLs</Text>
      <View style={styles.card}>
        {presetUrls.map((item, index) => (
          <View
            key={item.url}
            style={[styles.urlRow, index > 0 && styles.borderTop]}>
            <View style={styles.urlInfo}>
              <Text style={styles.urlLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.urlText} numberOfLines={1}>
                {item.url}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleRemove(item.url)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <IconSymbol name="xmark" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ))}

        {showAdd ? (
          <View style={[styles.addForm, presetUrls.length > 0 && styles.borderTop]}>
            <TextInput
              style={styles.addInput}
              value={label}
              onChangeText={setLabel}
              placeholder="Label (e.g. Google)"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <TextInput
              style={[styles.addInput, styles.borderTop]}
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="url"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <View style={[styles.addActions, styles.borderTop]}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setLabel('');
                  setUrl('');
                  setShowAdd(false);
                }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addRowBtn, presetUrls.length > 0 && styles.borderTop]}
            onPress={() => setShowAdd(true)}>
            <IconSymbol name="plus" size={16} color="#2563EB" />
            <Text style={styles.addRowText}>Add URL</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  borderTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  urlInfo: {
    flex: 1,
    gap: 2,
  },
  urlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  urlText: {
    fontSize: 12,
    color: '#6B7280',
  },
  addForm: {
    overflow: 'hidden',
  },
  addInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  addActions: {
    flexDirection: 'row',
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E5E7EB',
  },
  cancelText: {
    fontSize: 14,
    color: '#6B7280',
  },
  addBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  addRowText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
});
