import { useState } from 'react';
import { calculatorApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
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
import { Calculator, MapPin, Truck, DollarSign, Fuel, TrendingUp, Loader2 } from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function CalculatorPage() {
  const [form, setForm] = useState({
    pickup_state: '',
    dropoff_state: '',
    equipment: 'van',
    weight_lbs: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!form.pickup_state || !form.dropoff_state) return;
    
    setLoading(true);
    try {
      const res = await calculatorApi.calculateRate({
        pickup_state: form.pickup_state,
        dropoff_state: form.dropoff_state,
        equipment: form.equipment,
        weight_lbs: form.weight_lbs ? parseInt(form.weight_lbs) : null,
      });
      setResult(res.data);
    } catch (err) {
      console.error('Calculator error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
            Rate Calculator
          </h1>
          <p className="text-zinc-500 mt-1">Estimate rates and profitability for your lanes</p>
        </div>

        <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-500" />
                Pickup State
              </Label>
              <Select value={form.pickup_state} onValueChange={(v) => setForm({ ...form, pickup_state: v })}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="calc-pickup-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 max-h-60">
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                Dropoff State
              </Label>
              <Select value={form.dropoff_state} onValueChange={(v) => setForm({ ...form, dropoff_state: v })}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="calc-dropoff-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 max-h-60">
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-500" />
                Equipment
              </Label>
              <Select value={form.equipment} onValueChange={(v) => setForm({ ...form, equipment: v })}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="calc-equipment">
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
              <Label>Weight (lbs) - Optional</Label>
              <Input
                type="number"
                value={form.weight_lbs}
                onChange={(e) => setForm({ ...form, weight_lbs: e.target.value })}
                placeholder="40000"
                className="bg-zinc-950 border-zinc-800"
                data-testid="calc-weight"
              />
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            className="w-full mt-6 gap-2"
            disabled={!form.pickup_state || !form.dropoff_state || loading}
            data-testid="calculate-btn"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            Calculate Rate
          </Button>
        </div>

        {result && (
          <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6 animate-fade-in">
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight mb-6">
              Estimated Results
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-500 text-sm">Distance</span>
                </div>
                <p className="font-mono text-2xl font-bold">{result.distance_miles} mi</p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-500 text-sm">Rate per Mile</span>
                </div>
                <p className="font-mono text-2xl font-bold">{formatMoney(result.rate_per_mile_cents)}</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-800 rounded-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-500 text-sm">Estimated Rate</span>
                </div>
                <p className="font-mono text-3xl font-bold text-amber-500">
                  {formatMoney(result.estimated_rate_cents)}
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Fuel className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-500 text-sm">Fuel Estimate</span>
                </div>
                <p className="font-mono text-2xl font-bold text-red-400">
                  -{formatMoney(result.fuel_estimate_cents)}
                </p>
              </div>

              <div className="md:col-span-2 bg-emerald-500/10 border border-emerald-800 rounded-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-500 text-sm">Estimated Profit</span>
                </div>
                <p className="font-mono text-3xl font-bold text-emerald-500">
                  {formatMoney(result.profit_estimate_cents)}
                </p>
              </div>
            </div>

            <p className="text-zinc-500 text-sm mt-4">
              * Estimates based on average market rates. Actual rates may vary.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
