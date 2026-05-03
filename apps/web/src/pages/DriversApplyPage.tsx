import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Send,
  ShieldCheck,
  Truck,
  Wallet,
  Zap,
} from 'lucide-react';

const benefits = [
  {
    title: 'Free to start',
    description:
      'No fee to apply, get verified, or take your first loads. Driver Pro is optional once you have proven you can deliver clean.',
    icon: <Wallet size={20} />,
  },
  {
    title: 'Verified drivers get priority',
    description:
      'Identity, insurance, and authority verification gates the load board. Approved drivers see better-paying loads first.',
    icon: <ShieldCheck size={20} />,
  },
  {
    title: 'Faster pay after delivery',
    description:
      'Submit signed POD and photo proof from the app. Driver Pro adds a faster payout option and performance insights.',
    icon: <Zap size={20} />,
  },
];

const equipment = [
  'Cargo van',
  'Sprinter van',
  'Box truck (16–26 ft)',
  'Power-only',
  'Dry van',
  'Reefer',
  'Flatbed',
];

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  equipment: 'Cargo van',
  mcNumber: '',
  dotNumber: '',
  yearsExperience: '',
  notes: '',
};

const DriversApplyPage: React.FC = () => {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof typeof initialForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <section className="border-b border-infamous-border bg-gradient-to-b from-[#17110d] to-[#090909]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Link to="/home" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
            <ArrowLeft size={16} /> Back to Infamous Freight
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-infamous-orange/30 bg-infamous-orange/10 px-4 py-2 text-sm text-infamous-orange">
                <Truck size={16} /> Apply to drive with Infamous Freight
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Get verified. Get loads. Get paid.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-300">
                Cargo van, sprinter, box truck, and small fleet drivers running local and regional freight. No fee
                to start, no commitment — apply, upload your documents, and start running loads once verified.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="rounded-2xl border border-infamous-border bg-infamous-card p-5"
                  >
                    <div className="mb-3 inline-flex rounded-xl bg-infamous-orange/10 p-2 text-infamous-orange">
                      {benefit.icon}
                    </div>
                    <h3 className="text-base font-bold">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{benefit.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-infamous-border bg-[#111] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">
                  How it works
                </p>
                <ol className="mt-4 space-y-3 text-sm text-gray-300">
                  {[
                    'Submit a short application with your equipment and contact info',
                    'Upload license, insurance, and authority documents',
                    'Get verified — usually within a couple of business days',
                    'Accept your first load, complete it, get paid',
                    'Optional: upgrade to Driver Pro for priority loads and faster payout',
                  ].map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-infamous-orange text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
                <Link
                  to="/pricing"
                  className="mt-5 inline-flex items-center gap-2 text-sm text-infamous-orange hover:underline"
                >
                  See driver plans <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <aside className="rounded-3xl border border-infamous-border bg-infamous-card p-6 shadow-2xl lg:p-8">
              <h2 className="text-2xl font-bold">Driver application</h2>
              <p className="mt-2 text-sm text-gray-400">
                We will follow up to verify documents before assigning loads.
              </p>

              {submitted ? (
                <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
                  <CheckCircle2 className="mb-3 text-green-400" size={32} />
                  <h3 className="text-xl font-bold">Application received</h3>
                  <p className="mt-2 text-gray-300">
                    Onboarding will reach out with the document upload link and next steps. Most drivers are
                    verified within a couple of business days.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setForm(initialForm);
                    }}
                    className="mt-5 rounded-xl bg-infamous-orange px-4 py-2 font-semibold text-white"
                  >
                    Submit another application
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      ['fullName', 'Full name'],
                      ['email', 'Email'],
                      ['phone', 'Phone'],
                      ['city', 'City'],
                      ['state', 'State'],
                      ['mcNumber', 'MC number (optional)'],
                      ['dotNumber', 'DOT number (optional)'],
                      ['yearsExperience', 'Years of experience'],
                    ].map(([key, label]) => (
                      <label key={key} className="block">
                        <span className="mb-2 block text-sm font-medium text-gray-300">{label}</span>
                        <input
                          value={form[key as keyof typeof initialForm]}
                          onChange={(event) =>
                            update(key as keyof typeof initialForm, event.target.value)
                          }
                          className="w-full rounded-xl border border-infamous-border bg-[#111] px-4 py-3 text-white outline-none transition focus:border-infamous-orange"
                          placeholder={label}
                        />
                      </label>
                    ))}
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-gray-300">Equipment</span>
                      <select
                        value={form.equipment}
                        onChange={(event) => update('equipment', event.target.value)}
                        className="w-full rounded-xl border border-infamous-border bg-[#111] px-4 py-3 text-white outline-none transition focus:border-infamous-orange"
                      >
                        {equipment.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-300">Notes</span>
                    <textarea
                      value={form.notes}
                      onChange={(event) => update('notes', event.target.value)}
                      className="min-h-28 w-full rounded-xl border border-infamous-border bg-[#111] px-4 py-3 text-white outline-none transition focus:border-infamous-orange"
                      placeholder="Coverage area, lanes you prefer, fleet size, anything else we should know."
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-infamous-orange px-5 py-3 font-semibold text-white transition hover:opacity-90"
                  >
                    Submit application <Send size={17} />
                  </button>
                  <p className="text-xs text-gray-500">
                    By submitting, you agree to be contacted about onboarding and document verification.
                  </p>
                </form>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
};

export default DriversApplyPage;
