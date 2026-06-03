import {
  EnvGatedMessagingProvider,
  type SendMessageRequest,
  type SendMessageResult,
} from './messagingProvider';

export class SendGridProvider extends EnvGatedMessagingProvider {
  providerName = 'sendgrid' as const;

  constructor() {
    super(['SENDGRID_API_KEY']);
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.providerName,
        channel: request.channel,
        status: 'skipped',
        message: 'SendGrid message skipped because required configuration is missing.',
      };
    }

    throw new Error('SendGrid messaging requires sender verification and deliverability checks before live sends are enabled.');
  }
}

export const sendGridProvider = new SendGridProvider();
