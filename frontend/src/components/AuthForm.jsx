import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Truck, AlertCircle } from 'lucide-react';

export const AuthForm = ({ mode = 'signin' }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'shipper',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await login(formData.email, formData.password);
      } else {
        await register(
          formData.email,
          formData.password,
          formData.displayName,
          formData.role
        );
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-panel rounded-sm p-8 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-amber-500 rounded-sm mb-4">
              <Truck className="h-8 w-8 text-black" />
            </div>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="text-zinc-500 mt-2">
              {mode === 'signin'
                ? 'Welcome back to IMFÆMOUS FREIGHT'
                : 'Join the freight marketplace'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 bg-red-950/50 border border-red-800 rounded-sm text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Your name or company"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    className="bg-zinc-950 border-zinc-800"
                    data-testid="input-display-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">I am a</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger
                      className="bg-zinc-950 border-zinc-800"
                      data-testid="select-role"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800">
                      <SelectItem value="shipper">Shipper (Post Loads)</SelectItem>
                      <SelectItem value="carrier">Carrier (Bid on Loads)</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-zinc-950 border-zinc-800"
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-zinc-950 border-zinc-800"
                required
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={loading}
              data-testid="auth-submit-btn"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-zinc-500">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <Link
                  to="/sign-up"
                  className="text-amber-500 hover:text-amber-400 transition-colors"
                  data-testid="link-signup"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link
                  to="/sign-in"
                  className="text-amber-500 hover:text-amber-400 transition-colors"
                  data-testid="link-signin"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
