import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  redisUrl: process.env.REDIS_URL || '',
  maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH || '500', 10),
  maxMessagesPerWindow: parseInt(process.env.MAX_MESSAGES_PER_WINDOW || '10', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '5000', 10),
  maxImageSizeBytes: parseInt(process.env.MAX_IMAGE_SIZE_MB || '2', 10) * 1024 * 1024,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};
