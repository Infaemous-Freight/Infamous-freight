export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Product</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li><a href="/pricing" className="hover:text-gray-900">Pricing</a></li>
              <li><a href="/dashboard" className="hover:text-gray-900">Dashboard</a></li>
              <li><a href="#features" className="hover:text-gray-900">Features</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Company</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li><a href="/about" className="hover:text-gray-900">About</a></li>
              <li><a href="/contact" className="hover:text-gray-900">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li><a href="/pages/legal/privacy-policy" className="hover:text-gray-900">Privacy Policy</a></li>
              <li><a href="/pages/legal/terms-of-service" className="hover:text-gray-900">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Support</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li><a href="/contact" className="hover:text-gray-900">Help Center</a></li>
              <li><a href="mailto:support@infamousfreight.com" className="hover:text-gray-900">Email Us</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            © {year} Infæmous Freight Enterprises. All rights reserved.
          </p>
          <p className="text-sm font-semibold tracking-tight text-gray-900">Infæmous Freight</p>
        </div>
      </div>
    </footer>
  );
}
