import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock login — in production: call api.login() or api.register()
    await new Promise((r) => setTimeout(r, 1000));

    const mockToken = `mock_token_${Date.now()}`;
    localStorage.setItem('infamous_token', mockToken);
    setUser({
      id: 'user_1',
      email,
      name: email.split('@')[0],
      role: 'owner',
      carrierId: 'carrier_1',
    });

    toast.success(isRegister ? 'Account created!' : 'Welcome back!');
    navigate('/');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-infamous-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-infamous-orange to-infamous-orange-light flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">INFAMOUS FREIGHT</h1>
          <p className="text-gray-500 text-sm mt-1">Freight Command Center</p>
        </div>

        {/* Card */}
        <div className="bg-infamous-card border border-infamous-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-1">{isRegister ? 'Create Account' : 'Sign In'}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {isRegister ? 'Start your 14-day free trial' : 'Welcome back — sign in to dispatch'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="dispatch@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Company Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Acme Trucking LLC"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3"
            >
              {loading ? '...' : isRegister ? 'Create Account & Start Trial' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-gray-500 hover:text-infamous-orange transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Get started"}
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-gray-600">
          <span>🔒 Bank-level encryption</span>
          <span>•</span>
          <span>14-day free trial</span>
          <span>•</span>
          <span>No credit card required</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
