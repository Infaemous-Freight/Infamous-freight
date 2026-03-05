import { logger } from '../lib/logger.js';

export async function notify(topic: string, payload: unknown) {
  // Replace with SendGrid/Twilio/FCM/Slack/etc.
  logger.info({ topic, payload }, 'notify');
}
