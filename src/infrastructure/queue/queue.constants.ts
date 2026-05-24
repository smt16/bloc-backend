export const QUEUE_MEDIA_PROCESSING = 'media-processing';
export const QUEUE_NOTIFICATIONS = 'notifications';
export const QUEUE_FEED_FANOUT = 'feed-fanout';
export const QUEUE_ANALYTICS_EVENTS = 'analytics-events';

export const ALL_QUEUES = [
  QUEUE_MEDIA_PROCESSING,
  QUEUE_NOTIFICATIONS,
  QUEUE_FEED_FANOUT,
  QUEUE_ANALYTICS_EVENTS,
] as const;

export type QueueName = (typeof ALL_QUEUES)[number];
