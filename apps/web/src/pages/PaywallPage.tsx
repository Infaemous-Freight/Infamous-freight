import { Link } from 'react-router-dom';
import { Lock, ShieldCheck, Sparkles } from 'lucide-react';

const tiers = [
  { name: 'Starter', price: '$99/mo', features: ['Up to 500 loads', 'Core dispatch workflows'] },
  { name: 'Professional', price: '$499/mo', features: ['Unlimited loads', 'Advanced analytics', 'Priority support'], recommended: true },
  { name: 'Enterprise', price: 'Custom', features: ['Dedicated support', 'SLA and custom integrations'] },
];

const PaywallPage: React.FC = () => (
  <main className="min-h-screen bg-[#090909] px-6 py-10 text-white">
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 rounded-2xl border border-infamous-border bg-infamous-card p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-infamous-orange/10 px-3 py-1 text-xs text-infamous-orange">
          <Lock size={14} /> Subscription required
        </div>
        <h1 className="mt-3 text-3xl font-black">Paywall & Access Control</h1>
        <p className="mt-2 text-sm text-gray-400">This feature is available on paid plans. Upgrade in billing settings to unlock protected workflows.</p>
        <Link to="/settings" className="btn-primary mt-5 inline-flex items-center gap-2">
          <ShieldCheck size={16} /> Open Billing Settings
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier.name} className={`rounded-2xl border p-5 ${tier.recommended ? 'border-infamous-orange/50 bg-infamous-orange/5' : 'border-infamous-border bg-infamous-card'}`}>
            <h2 className="text-lg font-bold">{tier.name}</h2>
            <p className="mt-1 text-xl text-infamous-orange">{tier.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2"><Sparkles size={14} className="text-infamous-orange" />{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </main>
);

export default PaywallPage;
