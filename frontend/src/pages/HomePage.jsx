import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Truck, Package, MessageSquare, Zap, ArrowRight, Shield, Clock } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section
        className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(11, 11, 16, 0.85), rgba(11, 11, 16, 0.95)), url('https://images.unsplash.com/photo-1763895971784-f7e00791cae3?crop=entropy&cs=srgb&fm=jpg&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b0b10]" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-amber-500/10 border border-amber-500/30 rounded-sm">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-amber-500 text-sm font-mono uppercase tracking-wider">
              AI-Powered Freight Marketplace
            </span>
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-tight mb-6">
            Move Freight.
            <br />
            <span className="text-amber-500">Get Truck'N.</span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            Post loads, bid competitively, book instantly. Built for shippers and carriers
            who demand efficiency.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={user ? '/loads/new' : '/sign-up'}>
              <Button size="lg" className="gap-2 text-lg px-8" data-testid="hero-cta-post">
                <Package className="h-5 w-5" />
                {user ? 'Post a Load' : 'Start Shipping'}
              </Button>
            </Link>
            <Link to="/loads">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8" data-testid="hero-cta-browse">
                Browse Loads
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative hazard stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-1 hazard-stripe" />
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold uppercase tracking-tight mb-4">
              Why Choose IMFÆMOUS FREIGHT?
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              The freight marketplace built for speed, transparency, and results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-8 hover:border-amber-500/50 transition-colors duration-300">
              <div className="p-3 bg-amber-500/10 rounded-sm w-fit mb-6">
                <Package className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="font-heading text-xl font-bold uppercase tracking-tight mb-3">
                Post & Book Instantly
              </h3>
              <p className="text-zinc-500">
                Shippers post loads, carriers bid competitively. Book the best rate with one click.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-8 hover:border-amber-500/50 transition-colors duration-300">
              <div className="p-3 bg-blue-500/10 rounded-sm w-fit mb-6">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-heading text-xl font-bold uppercase tracking-tight mb-3">
                AI-Powered Messaging
              </h3>
              <p className="text-zinc-500">
                Per-load messaging threads with automatic AI summaries. Never miss a detail.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-8 hover:border-amber-500/50 transition-colors duration-300">
              <div className="p-3 bg-emerald-500/10 rounded-sm w-fit mb-6">
                <Shield className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="font-heading text-xl font-bold uppercase tracking-tight mb-3">
                Secure & Transparent
              </h3>
              <p className="text-zinc-500">
                Full visibility on rates, bids, and assignments. No hidden fees, no surprises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="font-heading text-4xl font-bold text-amber-500">24/7</p>
              <p className="text-zinc-500 text-sm mt-1">Platform Access</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-4xl font-bold text-amber-500">
                <Clock className="h-8 w-8 inline-block" />
              </p>
              <p className="text-zinc-500 text-sm mt-1">Real-time Bidding</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-4xl font-bold text-amber-500">AI</p>
              <p className="text-zinc-500 text-sm mt-1">Thread Summaries</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-4xl font-bold text-amber-500">$0</p>
              <p className="text-zinc-500 text-sm mt-1">Hidden Fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-4 bg-amber-500 rounded-sm w-fit mx-auto mb-8">
            <Truck className="h-10 w-10 text-black" />
          </div>
          <h2 className="font-heading text-4xl font-bold uppercase tracking-tight mb-4">
            Ready to Get Truck'N?
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto mb-8">
            Join thousands of shippers and carriers on the most efficient freight marketplace.
          </p>
          <Link to={user ? '/loads' : '/sign-up'}>
            <Button size="lg" className="gap-2 text-lg px-8" data-testid="footer-cta">
              {user ? 'Browse Loads' : 'Get Started Free'}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-amber-500" />
            <span className="font-heading text-sm uppercase tracking-tight">IMFÆMOUS FREIGHT</span>
          </div>
          <p className="text-zinc-600 text-sm font-mono">
            © {new Date().getFullYear()} Get Truck'N MVP
          </p>
        </div>
      </footer>
    </div>
  );
}
