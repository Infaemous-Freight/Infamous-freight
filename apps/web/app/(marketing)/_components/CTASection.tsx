export function CTASection() {
  return (
    <section className="bg-gray-900 py-20">
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to modernize your freight operations?
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Join dispatch teams already using Infæmous Freight to automate operations, reduce costs, and deliver faster.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="/register"
            className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Start free trial
          </a>
          <a
            href="/contact"
            className="rounded-lg border border-gray-600 px-8 py-3 text-sm font-semibold text-white hover:border-gray-400 transition-colors"
          >
            Talk to sales
          </a>
        </div>
      </div>
    </section>
  );
}
