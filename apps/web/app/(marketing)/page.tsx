import { DashboardSection } from "./_components/DashboardSection";
import { HeroSection } from "./_components/HeroSection";
import { LoadboardSection } from "./_components/LoadboardSection";
import { PaletteSection } from "./_components/PaletteSection";
import { SiteHeader } from "./_components/SiteHeader";
import { SystemSection } from "./_components/SystemSection";

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <HeroSection />
      <PaletteSection />
      <DashboardSection />
      <LoadboardSection />
      <SystemSection />
    </main>
  );
}
