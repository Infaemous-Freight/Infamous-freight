import Link from "next/link";

export default function BookDemoPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-black">Book Demo</h1>
        <p className="mt-3 text-white/75">
          Enterprise onboarding includes integrations, operational setup, usage modeling, and
          contract review. Share your team details and we will schedule a guided demo.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="mailto:sales@infamousfreight.com" className="btn btn-primary text-center">
            Email Sales
          </Link>
          <Link href="/contact-sales" className="btn btn-secondary text-center">
            Contact Sales Form
          </Link>
        </div>
      </div>
    </main>
  );
}
