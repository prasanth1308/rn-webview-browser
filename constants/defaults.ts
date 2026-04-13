export const DEFAULT_HOME_URL = 'https://example.com';

export const DEFAULT_PRESET_URLS = [
  { label: 'Example', url: 'https://example.com' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com' },
  { label: 'MDN', url: 'https://developer.mozilla.org' },
];

export const STORAGE_KEYS = {
  PRESET_URLS: '@settings/preset_urls',
  NOTIFICATION_ENABLED: '@settings/notification_enabled',
  USER_PROFILE: '@settings/user_profile',
} as const;
