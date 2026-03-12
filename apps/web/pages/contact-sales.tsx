import Link from "next/link";

export default function ContactSalesPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-black">Contact Sales</h1>
        <p className="mt-3 text-white/75">
          Talk with the Infæmous Freight team about Enterprise platform access, billing policy,
          integrations, and rollout planning.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-white/80">
          <li>• Enterprise platform fee: $499/month</li>
          <li>• Minimum monthly spend: $2,500</li>
          <li>• Usage-based AI automation available</li>
        </ul>
        <div className="mt-6">
          <Link href="mailto:sales@infamousfreight.com" className="btn btn-primary">
            sales@infamousfreight.com
          </Link>
        </div>
      </div>
    </main>
  );
}
