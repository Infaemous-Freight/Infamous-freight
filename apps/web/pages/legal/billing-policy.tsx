import Head from "next/head";

export default function BillingPolicyPage() {
  return (
    <>
      <Head>
        <title>Billing Policy | Infæmous Freight</title>
        <meta
          name="description"
          content="Billing and subscription terms for Infæmous Freight, including invoicing, payment failures, and subscription cancellations."
        />
      </Head>
      <main className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-black">Billing Policy</h1>
          <ul className="mt-6 space-y-3 text-sm text-white/80">
            <li>• Starter and Professional are billed monthly via Stripe self-serve checkout.</li>
            <li>• Enterprise is invoice-first and requires a signed commercial agreement.</li>
            <li>• Enterprise minimum monthly spend is $2,500.</li>
            <li>• Failed payments may result in account suspension until billing is resolved.</li>
            <li>• Subscription cancellations stop future renewals at the end of the billing period.</li>
          </ul>
        </div>
      </main>
    </>
  );
}
