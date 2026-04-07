import type { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© Infamous Freight</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-4">
            <a className="hover:text-gray-900" href="/support">
              Support
            </a>
            <a className="hover:text-gray-900" href="/privacy">
              Privacy
            </a>
            <a className="hover:text-gray-900" href="/terms">
              Terms
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
