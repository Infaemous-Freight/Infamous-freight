import Link from "next/link";

export default function ContactSalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black">Contact Sales</h1>
      <p className="mt-3 text-white/70">
        Tell us about your fleet size, automation goals, and compliance needs. We will respond with
        an enterprise proposal.
      </p>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="space-y-3 text-sm text-white/70">
          <div>📧 sales@infamousfreight.ai</div>
          <div>📞 +1 (415) 555-0199</div>
          <div>🕒 Response SLA: 1 business day</div>
        </div>

        <div className="mt-6 flex gap-4">
          <Link
            className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
            href="/pricing"
          >
            Back to pricing
          </Link>
          <Link
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold"
            href="/"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
