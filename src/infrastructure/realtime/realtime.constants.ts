export const REALTIME_CHANNELS = {
  FEED_UPDATE: 'realtime:feed:update',
  MESSAGE: 'realtime:message',
  NOTIFICATION: 'realtime:notification',
} as const;

export type RealtimeChannel =
  (typeof REALTIME_CHANNELS)[keyof typeof REALTIME_CHANNELS];
