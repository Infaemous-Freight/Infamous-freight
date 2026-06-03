import {
  EnvGatedMessagingProvider,
  type SendMessageRequest,
  type SendMessageResult,
} from './messagingProvider';

export class TwilioProvider extends EnvGatedMessagingProvider {
  providerName = 'twilio' as const;

  constructor() {
    super(['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']);
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.providerName,
        channel: request.channel,
        status: 'skipped',
        message: 'Twilio message skipped because required configuration is missing.',
      };
    }

    throw new Error('Twilio messaging requires sender configuration and deliverability verification before live sends are enabled.');
  }
}

export const twilioProvider = new TwilioProvider();
