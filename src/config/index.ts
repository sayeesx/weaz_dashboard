export const APP_CONFIG = {
  name: 'WEAZ',
  description: 'Admin Operations Dashboard',
  version: '1.0.0',
  currency: 'INR',
  locale: 'en-IN',
  timezone: 'Asia/Kolkata',
  domain: 'admin.weaz.in',
} as const;

export const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

export const DEFAULT_MAP_CENTER = {
  lat: 10.0159,  // Kerala center
  lng: 76.3419,
  zoom: 10,
} as const;

export const PAGINATION_DEFAULTS = {
  pageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
} as const;

export const REALTIME_CHANNELS = {
  orders: 'realtime:orders',
  inventory: 'realtime:inventory',
  partners: 'realtime:partners',
  notifications: 'realtime:notifications',
  analytics: 'realtime:analytics',
  system: 'realtime:system',
} as const;

export const KEYBOARD_SHORTCUTS = {
  commandPalette: 'mod+k',
  search: 'mod+/',
  notifications: 'mod+n',
  aiPanel: 'mod+j',
  newOrder: 'mod+shift+o',
  newProduct: 'mod+shift+p',
  settings: 'mod+,',
  escape: 'Escape',
} as const;
