import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { loadsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, MapPin, Calendar, Truck, AlertCircle, DollarSign } from 'lucide-react';

export default function NewLoadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [form, setForm] = useState({
    pickup_city: '',
    pickup_state: '',
    pickup_date: today,
    dropoff_city: '',
    dropoff_state: '',
    dropoff_date: tomorrow,
    equipment: 'van',
    weight_lbs: '',
    target_rate_cents: '',
    commodity: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      navigate('/sign-in');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        weight_lbs: form.weight_lbs ? parseInt(form.weight_lbs) : null,
        target_rate_cents: form.target_rate_cents ? parseInt(form.target_rate_cents) * 100 : null,
      };

      const res = await loadsApi.create(payload);
      navigate(`/loads/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create load');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold uppercase mb-2">Sign In Required</h1>
          <p className="text-zinc-500 mb-4">Please sign in to post a load.</p>
          <Button onClick={() => navigate('/sign-in')} data-testid="post-signin">Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
            Post a Load
          </h1>
          <p className="text-zinc-500 mt-1">Create a new freight load for carriers to bid on</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-950/50 border border-red-800 rounded-sm text-red-400">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Pickup Section */}
          <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-amber-500" />
              <h2 className="font-heading text-lg font-bold uppercase tracking-tight">Pickup</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <Label>City</Label>
                <Input
                  value={form.pickup_city}
                  onChange={(e) => setForm({ ...form, pickup_city: e.target.value })}
                  placeholder="Oklahoma City"
                  className="bg-zinc-950 border-zinc-800"
                  required
                  data-testid="input-pickup-city"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={form.pickup_state}
                  onChange={(e) => setForm({ ...form, pickup_state: e.target.value })}
                  placeholder="OK"
                  className="bg-zinc-950 border-zinc-800"
                  required
                  data-testid="input-pickup-state"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.pickup_date}
                  onChange={(e) => setForm({ ...form, pickup_date: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                  required
                  data-testid="input-pickup-date"
                />
              </div>
            </div>
          </div>

          {/* Dropoff Section */}
          <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-emerald-500" />
              <h2 className="font-heading text-lg font-bold uppercase tracking-tight">Dropoff</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <Label>City</Label>
                <Input
                  value={form.dropoff_city}
                  onChange={(e) => setForm({ ...form, dropoff_city: e.target.value })}
                  placeholder="Dallas"
                  className="bg-zinc-950 border-zinc-800"
                  required
                  data-testid="input-dropoff-city"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={form.dropoff_state}
                  onChange={(e) => setForm({ ...form, dropoff_state: e.target.value })}
                  placeholder="TX"
                  className="bg-zinc-950 border-zinc-800"
                  required
                  data-testid="input-dropoff-state"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.dropoff_date}
                  onChange={(e) => setForm({ ...form, dropoff_date: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                  required
                  data-testid="input-dropoff-date"
                />
              </div>
            </div>
          </div>

          {/* Load Details */}
          <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-blue-500" />
              <h2 className="font-heading text-lg font-bold uppercase tracking-tight">
                Load Details
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Equipment</Label>
                <Select
                  value={form.equipment}
                  onValueChange={(v) => setForm({ ...form, equipment: v })}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="select-equipment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="reefer">Reefer</SelectItem>
                    <SelectItem value="flatbed">Flatbed</SelectItem>
                    <SelectItem value="step_deck">Step Deck</SelectItem>
                    <SelectItem value="hotshot">Hotshot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Weight (lbs)</Label>
                <Input
                  type="number"
                  value={form.weight_lbs}
                  onChange={(e) => setForm({ ...form, weight_lbs: e.target.value })}
                  placeholder="40000"
                  className="bg-zinc-950 border-zinc-800"
                  data-testid="input-weight"
                />
              </div>
              <div className="space-y-2">
                <Label>Target Rate ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type="number"
                    value={form.target_rate_cents}
                    onChange={(e) => setForm({ ...form, target_rate_cents: e.target.value })}
                    placeholder="2500"
                    className="bg-zinc-950 border-zinc-800 pl-9"
                    data-testid="input-rate"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label>Commodity</Label>
              <Input
                value={form.commodity}
                onChange={(e) => setForm({ ...form, commodity: e.target.value })}
                placeholder="General Freight, Electronics, etc."
                className="bg-zinc-950 border-zinc-800"
                data-testid="input-commodity"
              />
            </div>

            <div className="mt-4 space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Special instructions, requirements, etc."
                className="bg-zinc-950 border-zinc-800 min-h-[100px]"
                data-testid="input-notes"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/loads')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2" data-testid="submit-load-btn">
              <Package className="h-4 w-4" />
              {loading ? 'Posting...' : 'Post Load'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
