import {
  configuredIntegration,
  disabledIntegration,
  type IntegrationHealthCheck,
  type IntegrationProvider,
} from '../types';

export type MessagingProviderName = 'twilio' | 'sendgrid' | 'resend' | 'mock-messaging';

export type MessageChannel = 'sms' | 'email';

export interface MessageRecipient {
  email?: string;
  phone?: string;
  name?: string;
}

export interface SendMessageRequest {
  channel: MessageChannel;
  recipient: MessageRecipient;
  subject?: string;
  body: string;
  metadata?: Record<string, string>;
}

export interface SendMessageResult {
  provider: MessagingProviderName;
  channel: MessageChannel;
  status: 'skipped' | 'sent' | 'failed';
  externalMessageId?: string;
  message?: string;
}

export interface MessagingProvider extends IntegrationProvider {
  providerName: MessagingProviderName;
  sendMessage(request: SendMessageRequest): Promise<SendMessageResult>;
}

export abstract class EnvGatedMessagingProvider implements MessagingProvider {
  abstract providerName: MessagingProviderName;
  readonly category = 'messaging' as const;

  protected constructor(private readonly requiredEnvKeys: string[]) {}

  isConfigured(): boolean {
    return this.requiredEnvKeys.every((key) => Boolean(process.env[key]?.trim()));
  }

  async healthCheck(): Promise<IntegrationHealthCheck> {
    if (!this.isConfigured()) {
      return disabledIntegration(
        this.providerName,
        this.category,
        `${this.providerName} messaging is disabled because one or more required environment variables are missing.`,
      );
    }

    return configuredIntegration(
      this.providerName,
      this.category,
      `${this.providerName} messaging configuration is present. Run a deliverability smoke test before enabling production traffic.`,
    );
  }

  abstract sendMessage(request: SendMessageRequest): Promise<SendMessageResult>;
}
