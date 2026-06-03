import { type IntegrationProvider } from './types';
import { mockLoadBoardProvider } from './loadBoards/mockLoadBoardProvider';
import { datProvider } from './loadBoards/datProvider';
import { truckstopProvider } from './loadBoards/truckstopProvider';
import { project44Provider } from './tracking/project44Provider';
import { fourKitesProvider } from './tracking/fourKitesProvider';
import { samsaraProvider } from './tracking/samsaraProvider';
import { mockTrackingProvider } from './tracking/mockTrackingProvider';
import { quickBooksProvider } from './accounting/quickBooksProvider';
import { mockAccountingProvider } from './accounting/mockAccountingProvider';
import { twilioProvider } from './messaging/twilioProvider';
import { sendGridProvider } from './messaging/sendgridProvider';
import { mockMessagingProvider } from './messaging/mockMessagingProvider';
import { sentryProvider } from './observability/sentryProvider';
import { mockObservabilityProvider } from './observability/mockObservabilityProvider';
import { mockAnalyticsProvider } from './analytics/mockAnalyticsProvider';
import { mockMobileOperationsProvider } from './mobile/mockMobileOperationsProvider';

export const integrationProviders: IntegrationProvider[] = [
  datProvider,
  truckstopProvider,
  mockLoadBoardProvider,
  project44Provider,
  fourKitesProvider,
  samsaraProvider,
  mockTrackingProvider,
  quickBooksProvider,
  mockAccountingProvider,
  twilioProvider,
  sendGridProvider,
  mockMessagingProvider,
  sentryProvider,
  mockObservabilityProvider,
  mockAnalyticsProvider,
  mockMobileOperationsProvider,
];

export function getIntegrationProviders(): IntegrationProvider[] {
  return [...integrationProviders];
}

export function getIntegrationProvider(providerName: string): IntegrationProvider | undefined {
  return integrationProviders.find((provider) => provider.providerName === providerName);
}
