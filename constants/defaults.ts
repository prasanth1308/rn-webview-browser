export type NavTab = {
  id: string;
  name: string;
  path: string; // URL sub-path, e.g. '/home'
  icon?: string; // SF Symbol name (iOS) — optional; falls back to first char of name
};

export const DEFAULT_BASE_URL = "https://staging.app.tradebidauctions.com";
export const DEFAULT_LOGIN_PATH = "/login";

export const DEFAULT_TABS: NavTab[] = [
  { id: "search", name: "Search", path: "/", icon: "house.fill" },
  {
    id: "outbid",
    name: "Outbid",
    path: "/dashboard/outbid",
    icon: "creditcard.fill",
  },
  {
    id: "winning",
    name: "Winning",
    path: "/dashboard/winning",
    icon: "dollarsign.circle.fill",
  },
];

// Always appended as the last tab — never editable, never in DEFAULT_TABS
export const SETTINGS_TAB: NavTab = {
  id: "settings",
  name: "Settings",
  path: "",
  icon: "gearshape.fill",
};

export const STORAGE_KEYS = {
  NOTIFICATION_ENABLED: "@settings/notification_enabled",
  USER_PROFILE: "@settings/user_profile",
  BASE_URL: "@settings/base_url",
  LOGIN_PATH: "@settings/login_path",
} as const;
