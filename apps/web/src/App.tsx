import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import PublicLayout from '@/layouts/PublicLayout';
import SeoManager from '@/components/SeoManager';
import { AppErrorBoundary } from '@/components/SentryErrorBoundary';
import RouteGuard from '@/components/RouteGuard';
import { BRAND } from '@/lib/brand';
import { AiChatWidget } from '@/components/AiChatWidget';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const LoadsPage = lazy(() => import('@/pages/LoadsPage'));
const DispatchBoardPage = lazy(() => import('@/pages/DispatchBoardPage'));
const DriversPage = lazy(() => import('@/pages/DriversPage'));
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage'));
const CompliancePage = lazy(() => import('@/pages/CompliancePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const BillingRequiredPage = lazy(() => import('@/pages/BillingRequiredPage'));
const RateComparisonTool = lazy(() => import('@/components/RateComparisonTool'));
const OnboardingWizard = lazy(() => import('@/components/onboarding/OnboardingWizard'));
const MetricsDashboard = lazy(() => import('@/pages/MetricsDashboard'));
const CaseStudies = lazy(() => import('@/pages/CaseStudies'));
const ProductHunt = lazy(() => import('@/pages/ProductHunt'));
const GDPR = lazy(() => import('@/pages/GDPR'));
const LaunchValidationPage = lazy(() => import('@/pages/LaunchValidationPage'));
const PayPerLoadPricing = lazy(() =>
  import('@/components/PayPerLoadPricing').then((m) => ({ default: m.PayPerLoadPricing }))
);
const ReferralProgram = lazy(() =>
  import('@/components/ReferralProgram').then((m) => ({ default: m.ReferralProgram }))
);
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const CarriersPage = lazy(() => import('@/pages/CarriersPage'));
const AccountingDashboardPage = lazy(() => import('@/pages/AccountingDashboardPage'));
const QuoteRequestsPage = lazy(() => import('@/pages/QuoteRequestsPage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const PublicQuoteRequestPage = lazy(() => import('@/pages/PublicQuoteRequestPage'));
const ShipmentTrackingPage = lazy(() => import('@/pages/ShipmentTrackingPage'));
const CustomerPortalPage = lazy(() => import('@/pages/CustomerPortalPage'));
const CarrierPortalPage = lazy(() => import('@/pages/CarrierPortalPage'));
const PublicLoadBoardPage = lazy(() => import('@/pages/PublicLoadBoardPage'));
const FreightAssistantPage = lazy(() => import('@/pages/FreightAssistantPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const PartnersPage = lazy(() => import('@/pages/PartnersPage'));
const DriversApplyPage = lazy(() => import('@/pages/DriversApplyPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ServicesPage = lazy(() => import('@/pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('@/pages/ServiceDetailPage'));
const LegalPage = lazy(() => import('@/pages/LegalPage'));
const ResourcesPage = lazy(() => import('@/pages/ResourcesPage'));
const ResourceArticlePage = lazy(() => import('@/pages/ResourceArticlePage'));
const GraphHopperPage = lazy(() => import('@/pages/GraphHopperPage'));
const FAQPage = lazy(() => import('@/pages/FAQPage'));
const ThankYouPage = lazy(() => import('@/pages/ThankYouPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const DriverAppPage = lazy(() => import('@/pages/DriverAppPage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const ShipmentDetailPage = lazy(() => import('@/pages/ShipmentDetailPage'));

const RouteFallback = () => (
  <main
    className="min-h-screen w-full bg-infamous-dark p-5 text-[#F5E8E8] sm:p-6"
    style={{
      background:
        'radial-gradient(circle at top, rgba(255, 26, 26, 0.22), transparent 35%), linear-gradient(180deg, #160608 0%, #080204 100%)',
    }}
    aria-live="polite"
    aria-busy="true"
  >
    <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-8 py-10">
      <div className="h-5 w-44 animate-pulse rounded bg-infamous-red/30" aria-hidden="true" />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-5">
          <div className="h-14 max-w-2xl animate-pulse rounded-lg bg-[#F5E8E8]/14 sm:h-20" aria-hidden="true" />
          <div className="h-14 max-w-xl animate-pulse rounded-lg bg-[#F5E8E8]/10 sm:h-20" aria-hidden="true" />
          <div className="h-4 max-w-lg animate-pulse rounded bg-[#B88989]/30" aria-hidden="true" />
          <div className="h-4 max-w-md animate-pulse rounded bg-[#B88989]/20" aria-hidden="true" />
        </div>
        <div className="rounded-xl border border-infamous-border bg-infamous-card p-5">
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-infamous-red/25" aria-hidden="true" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#F5E8E8]/10" aria-hidden="true" />
                <div className="h-3 flex-1 animate-pulse rounded bg-[#F5E8E8]/10" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading freight command center.</span>
    </section>
  </main>
);

function App() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <SeoManager />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />

          <Route element={<PublicLayout />}>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:serviceSlug" element={<ServiceDetailPage />} />
            <Route path="/request-quote" element={<PublicQuoteRequestPage />} />
            <Route path="/quote" element={<PublicQuoteRequestPage />} />
            <Route path="/get-quote" element={<PublicQuoteRequestPage />} />
            <Route path="/track" element={<ShipmentTrackingPage />} />
            <Route path="/tracking" element={<ShipmentTrackingPage />} />
            <Route path="/track-shipment" element={<ShipmentTrackingPage />} />
            <Route path="/customer-portal" element={<CustomerPortalPage />} />
            <Route path="/shipment/:trackingId" element={<ShipmentDetailPage />} />
            <Route path="/carrier-portal" element={<CarrierPortalPage />} />
            <Route path="/load-board" element={<PublicLoadBoardPage />} />
            <Route path="/freight-assistant" element={<FreightAssistantPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/drivers" element={<DriversApplyPage />} />
            <Route path="/drive" element={<DriversApplyPage />} />
            <Route path="/terms" element={<LegalPage />} />
            <Route path="/privacy" element={<LegalPage />} />
            <Route path="/carrier-agreement" element={<LegalPage />} />
            <Route path="/shipper-agreement" element={<LegalPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/resources/:articleSlug" element={<ResourceArticlePage />} />
            <Route path="/graphhopper" element={<GraphHopperPage />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/product-hunt" element={<ProductHunt />} />
            <Route path="/gdpr" element={<GDPR />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingWizard />} />

          <Route element={<AppLayout />}>
            <Route path="/ops" element={<DashboardPage />} />
            <Route path="/loads" element={<LoadsPage />} />
            <Route path="/dispatch" element={<RouteGuard minRole="dispatcher"><DispatchBoardPage /></RouteGuard>} />
            <Route path="/ops/drivers" element={<RouteGuard minRole="dispatcher"><DriversPage /></RouteGuard>} />
            <Route path="/invoices" element={<RouteGuard minRole="dispatcher"><InvoicesPage /></RouteGuard>} />
            <Route path="/analytics" element={<RouteGuard minRole="admin"><MetricsDashboard /></RouteGuard>} />
            <Route path="/compliance" element={<RouteGuard minRole="admin"><CompliancePage /></RouteGuard>} />
            <Route path="/settings" element={<RouteGuard minRole="admin"><SettingsPage /></RouteGuard>} />
            <Route path="/settings/billing" element={<RouteGuard minRole="owner"><BillingRequiredPage /></RouteGuard>} />
            <Route path="/billing" element={<RouteGuard minRole="owner"><BillingRequiredPage /></RouteGuard>} />
            <Route path="/rate-comparison" element={<RouteGuard minRole="dispatcher"><RateComparisonTool /></RouteGuard>} />
            <Route path="/pay-per-load" element={<RouteGuard minRole="owner"><PayPerLoadPricing /></RouteGuard>} />
            <Route path="/referrals" element={<RouteGuard minRole="dispatcher"><ReferralProgram /></RouteGuard>} />
            <Route path="/launch-validation" element={<RouteGuard minRole="admin"><LaunchValidationPage /></RouteGuard>} />
            <Route path="/carriers" element={<RouteGuard minRole="admin"><CarriersPage /></RouteGuard>} />
            <Route path="/accounting" element={<RouteGuard minRole="admin"><AccountingDashboardPage /></RouteGuard>} />
            <Route path="/quotes" element={<RouteGuard minRole="dispatcher"><QuoteRequestsPage /></RouteGuard>} />
            <Route path="/messages" element={<RouteGuard minRole="driver"><MessagesPage /></RouteGuard>} />
            <Route path="/driver-app" element={<RouteGuard minRole="driver"><DriverAppPage /></RouteGuard>} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <AiChatWidget />
      </Suspense>
    </AppErrorBoundary>
  );
}

export default App;
