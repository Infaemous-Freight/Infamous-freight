import {
  EnvGatedMessagingProvider,
  type SendMessageRequest,
  type SendMessageResult,
} from './messagingProvider';

export class MockMessagingProvider extends EnvGatedMessagingProvider {
  providerName = 'mock-messaging' as const;

  constructor() {
    super([]);
  }

  override isConfigured(): boolean {
    return true;
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    return {
      provider: this.providerName,
      channel: request.channel,
      status: 'sent',
      externalMessageId: `mock-${request.channel}-${Date.now()}`,
      message: 'Mock messaging provider accepted the message for local and CI testing.',
    };
  }
}

export const mockMessagingProvider = new MockMessagingProvider();
