import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, FileText, ShieldCheck } from 'lucide-react';
import { BRAND } from '@/lib/brand';

const legalContent = {
  '/terms': {
    eyebrow: 'Terms',
    title: 'Terms of service',
    lastUpdated: 'May 20, 2026',
    intro:
      'These terms govern use of the Infamous Freight website, portals, quote tools, and freight operations workflows. By using the platform you agree to these terms.',
    sections: [
      ['Use of the platform', 'Users are responsible for providing accurate shipment, contact, company, driver, carrier, and payment information. Accounts may be suspended or terminated for submitting false or misleading data.'],
      ['Quotes and availability', 'Quotes, capacity, routes, equipment, and pickup windows are subject to dispatch review and operational confirmation. A submitted quote request is not a binding agreement until dispatch confirms pricing, capacity, equipment, and pickup details in writing.'],
      ['No misuse', 'Users may not submit false freight, carrier, driver, insurance, identity, or payment information. Automated scraping, unauthorized API access, and submission of spam or fraudulent data are prohibited.'],
      ['Operational updates', 'Shipment status, ETA, and proof-of-delivery tools are provided to improve visibility and may depend on carrier and driver updates. Infamous Freight does not guarantee the accuracy of third-party status data.'],
      ['Limitation of liability', 'Infamous Freight provides logistics coordination and technology services. Liability for loss or damage to freight is governed by the applicable carrier agreement, bill of lading, and federal regulations. Platform services are provided on an as-is basis without warranty of uninterrupted availability.'],
      ['Dispute resolution', 'Freight claims should be filed in writing within 9 months of delivery or scheduled delivery date, consistent with the Carmack Amendment. Platform-related disputes should be raised through the contact page before pursuing other remedies.'],
      ['Modifications', 'These terms may be updated periodically. Continued use of the platform after changes constitutes acceptance. Material changes will be noted with an updated revision date on this page.'],
    ],
  },
  '/privacy': {
    eyebrow: 'Privacy',
    title: 'Privacy policy',
    lastUpdated: 'May 20, 2026',
    intro:
      'This policy explains what information Infamous Freight collects, how it is used, and what rights you have regarding your data.',
    sections: [
      ['Information collected', 'We collect contact details, company information, shipment details, driver onboarding information, support messages, and technical data such as IP address, browser type, and device information through forms, portals, and platform usage.'],
      ['How information is used', 'Information is used to respond to quotes, support freight operations, verify drivers or carriers, process payments, improve service quality, prevent fraud, and send operational communications related to active shipments or accounts.'],
      ['Service providers', 'Operational data may be processed through hosting (Netlify, Fly.io), database, authentication (Supabase), payment (Stripe), analytics, error tracking (Sentry), and communication providers. These providers process data only as needed to deliver their services.'],
      ['Data retention', 'Shipment records, invoices, and carrier documents are retained for the duration required by transportation regulations and business needs, typically a minimum of 3 years. Contact form submissions are retained for 12 months unless an active business relationship exists.'],
      ['Your rights', 'You may request access to, correction of, or deletion of your personal information by contacting us through the contact page. We will respond within 30 days. California residents may exercise additional rights under the CCPA, and EU/EEA individuals may exercise rights under the GDPR as described on our GDPR page.'],
      ['Cookies and tracking', 'The platform uses essential cookies for session management and optional analytics cookies (Google Analytics) to understand usage patterns. You may disable non-essential cookies through your browser settings.'],
      ['Contact', 'Questions about privacy can be sent through the contact page or by emailing the address listed in the footer.'],
    ],
  },
  '/carrier-agreement': {
    eyebrow: 'Carrier agreement',
    title: 'Carrier operating expectations',
    lastUpdated: 'May 20, 2026',
    intro:
      'This page summarizes expectations for carriers and drivers using the Infamous Freight network. Final agreements may include additional terms confirmed in the written rate confirmation.',
    sections: [
      ['Verification', 'Carriers and drivers may be required to verify identity, operating authority, insurance coverage, payment details, and equipment before receiving load access. Documentation must remain current throughout the business relationship.'],
      ['Insurance requirements', 'Carriers must maintain the minimum insurance coverage required by FMCSA regulations, including auto liability and cargo insurance. Proof of coverage must be provided before dispatch and updated upon renewal or changes.'],
      ['Load execution', 'Assigned carriers are expected to follow pickup, delivery, tracking, communication, and proof-of-delivery requirements as specified in the rate confirmation. Deviations from agreed terms must be communicated to dispatch immediately.'],
      ['Fraud prevention', 'False authority, double-brokering, hidden reassignment, identity misrepresentation, or inaccurate documentation may result in immediate removal from the network and withholding of pending payments.'],
      ['Payment', 'Payment timing and terms are specified in the written rate confirmation for each load. Standard terms apply unless otherwise agreed in writing. Payment requires completed delivery, a signed bill of lading, and any required proof-of-delivery documentation.'],
      ['Indemnification', 'Carriers are responsible for loss, damage, or delay to freight while in their care, custody, and control, consistent with applicable federal law and the terms of the bill of lading.'],
    ],
  },
  '/shipper-agreement': {
    eyebrow: 'Shipper agreement',
    title: 'Shipper service expectations',
    lastUpdated: 'May 20, 2026',
    intro:
      'This page summarizes expectations for shippers requesting quotes, booking freight, and tracking shipments through Infamous Freight.',
    sections: [
      ['Accurate freight details', 'Shippers should provide complete origin, destination, freight type, equipment, weight, dimensions, timing, hazmat classification if applicable, and accessorial details. Inaccurate details may result in rate adjustments or service delays.'],
      ['Quote confirmation', 'Submitted quote requests are not final bookings until dispatch confirms pricing, capacity, equipment, and pickup details in writing. Rates are valid for the timeframe specified in the quote confirmation.'],
      ['Access and loading', 'Pickup and delivery locations should be prepared for the equipment requested and the freight being moved. Detention charges may apply if loading or unloading exceeds the timeframes specified in the rate confirmation.'],
      ['Documentation', 'Shipment records, PODs, invoices, and support notes may be used to complete billing and service follow-up. Shippers are responsible for providing accurate bills of lading and any required customs or compliance documentation.'],
      ['Claims', 'Freight damage or loss claims must be submitted in writing with supporting documentation within a reasonable timeframe. Claims are subject to the applicable carrier agreement and federal transportation regulations.'],
      ['Payment terms', 'Invoice payment terms are specified per shipment. Late payments may be subject to service suspension and applicable late fees as specified in the shipper agreement.'],
    ],
  },
};

type LegalPath = keyof typeof legalContent;

const LegalPage: React.FC = () => {
  const { pathname } = useLocation();
  const page = legalContent[(pathname in legalContent ? pathname : '/terms') as LegalPath];

  return (
    <main className="min-h-screen bg-[#090909] px-6 py-10 text-[#F5E8E8]">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <div className="mb-4 inline-flex rounded-xl bg-infamous-orange/10 p-3 text-infamous-orange">
            <FileText size={24} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">{page.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{page.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#F5E8E8]/80">{page.intro}</p>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#B88989]/70">
            Legal business name: {BRAND.legalName}
          </p>
          <p className="mt-1 text-xs text-[#B88989]/50">
            Last updated: {page.lastUpdated}
          </p>
        </header>

        <section className="space-y-4">
          {page.sections.map(([title, body]) => (
            <article key={title} className="rounded-3xl border border-infamous-border bg-infamous-card p-6">
              <div className="mb-3 flex items-center gap-3 text-infamous-orange">
                <ShieldCheck size={18} />
                <h2 className="text-xl font-bold text-[#F5E8E8]">{title}</h2>
              </div>
              <p className="text-sm leading-7 text-[#B88989]">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-infamous-border bg-[#0f0f0f] p-6">
          <h2 className="text-xl font-bold">Need help?</h2>
          <p className="mt-2 text-sm leading-6 text-[#B88989]">This page is an operational summary and should be reviewed with legal counsel before relying on it as a final contract.</p>
          <Link to="/contact" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-infamous-orange px-5 py-3 font-semibold text-[#F5E8E8]">
            Contact Infamous Freight <ArrowRight size={17} />
          </Link>
        </section>
      </div>
    </main>
  );
};

export default LegalPage;
