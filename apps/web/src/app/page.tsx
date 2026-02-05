import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-black">Infæmous Freight</h1>
      <p className="mt-3 text-white/70">
        AI-Powered Freight Operations Infrastructure — subscriptions + metered AI + enterprise
        invoicing.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
          href="/pricing"
        >
          View Pricing
        </Link>
        <Link
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold"
          href="/dashboard/usage"
        >
          Usage Dashboard
        </Link>
      </div>
    </div>
  );
}
