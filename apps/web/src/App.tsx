import { Routes, Route } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import LoadsPage from '@/pages/LoadsPage';
import DispatchBoardPage from '@/pages/DispatchBoardPage';
import DriversPage from '@/pages/DriversPage';
import InvoicesPage from '@/pages/InvoicesPage';
import CompliancePage from '@/pages/CompliancePage';
import SettingsPage from '@/pages/SettingsPage';
import RateComparisonTool from '@/components/RateComparisonTool';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import MetricsDashboard from '@/pages/MetricsDashboard';
import CaseStudies from '@/pages/CaseStudies';
import ProductHunt from '@/pages/ProductHunt';
import GDPR from '@/pages/GDPR';
import PayPerLoadPricing from '@/components/PayPerLoadPricing';
import ReferralProgram from '@/components/ReferralProgram';
import LoginPage from '@/pages/LoginPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/loads" element={<LoadsPage />} />
        <Route path="/dispatch" element={<DispatchBoardPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/analytics" element={<MetricsDashboard />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/rate-comparison" element={<RateComparisonTool />} />
        <Route path="/pay-per-load" element={<PayPerLoadPricing />} />
        <Route path="/referrals" element={<ReferralProgram />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/product-hunt" element={<ProductHunt />} />
        <Route path="/gdpr" element={<GDPR />} />
      </Route>

      {/* Public routes (no layout) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingWizard />} />
    </Routes>
  );
}

export default App;
