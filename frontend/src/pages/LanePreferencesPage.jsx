import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { preferencesApi, loadsApi } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/utils';
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
import { LoadCard } from '@/components/LoadCard';
import { MapPin, Truck, Plus, Trash2, Loader2, AlertCircle, Route } from 'lucide-react';
import { Link } from 'react-router-dom';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function LanePreferencesPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState([]);
  const [matchedLoads, setMatchedLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [newPref, setNewPref] = useState({
    pickup_state: undefined,
    dropoff_state: undefined,
    equipment: undefined,
    min_rate_cents: '',
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prefsRes, loadsRes] = await Promise.all([
        preferencesApi.getLanes(),
        preferencesApi.getMatchedLoads(),
      ]);
      setPreferences(prefsRes.data?.preferences || []);
      setMatchedLoads(loadsRes.data?.loads || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newPref.pickup_state || !newPref.dropoff_state) return;
    setAdding(true);
    try {
      await preferencesApi.addLane({
        pickup_state: newPref.pickup_state,
        dropoff_state: newPref.dropoff_state,
        equipment: newPref.equipment === 'any' ? null : newPref.equipment,
        min_rate_cents: newPref.min_rate_cents ? parseInt(newPref.min_rate_cents) * 100 : null,
      });
      setNewPref({ pickup_state: '', dropoff_state: '', equipment: '', min_rate_cents: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add preference');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await preferencesApi.deleteLane(id);
      fetchData();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold uppercase mb-2">Sign In Required</h1>
          <p className="text-zinc-500 mb-4">Please sign in to manage lane preferences.</p>
          <Link to="/sign-in">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
            Lane Preferences
          </h1>
          <p className="text-zinc-500 mt-1">Set your preferred routes and get matched loads</p>
        </div>

        {/* Add New Preference */}
        <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6 mb-8">
          <h2 className="font-heading text-lg font-bold uppercase tracking-tight mb-4">
            Add New Lane
          </h2>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={newPref.pickup_state} onValueChange={(v) => setNewPref({ ...newPref, pickup_state: v })}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="pref-from">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 max-h-60">
                  {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To</Label>
              <Select value={newPref.dropoff_state} onValueChange={(v) => setNewPref({ ...newPref, dropoff_state: v })}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800" data-testid="pref-to">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 max-h-60">
                  {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipment</Label>
              <Select value={newPref.equipment} onValueChange={(v) => setNewPref({ ...newPref, equipment: v })}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800">
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="reefer">Reefer</SelectItem>
                  <SelectItem value="flatbed">Flatbed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Min Rate ($)</Label>
              <Input
                type="number"
                value={newPref.min_rate_cents}
                onChange={(e) => setNewPref({ ...newPref, min_rate_cents: e.target.value })}
                placeholder="0"
                className="bg-zinc-950 border-zinc-800"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleAdd} disabled={adding} className="w-full gap-2" data-testid="add-lane-btn">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Current Preferences */}
        <div className="mb-8">
          <h2 className="font-heading text-lg font-bold uppercase tracking-tight mb-4">
            Your Lanes ({preferences.length})
          </h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-amber-500 animate-spin" /></div>
          ) : preferences.length === 0 ? (
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-8 text-center">
              <Route className="h-10 w-10 text-zinc-500 mx-auto mb-3" />
              <p className="text-zinc-500">No lane preferences set. Add one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {preferences.map((pref) => (
                <div key={pref.id} className="bg-[#121217] border border-zinc-800 rounded-sm p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      <span className="font-mono font-bold">{pref.pickup_state}</span>
                    </div>
                    <span className="text-zinc-500">→</span>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      <span className="font-mono font-bold">{pref.dropoff_state}</span>
                    </div>
                    {pref.equipment && (
                      <span className="text-zinc-500 uppercase text-sm">{pref.equipment}</span>
                    )}
                    {pref.min_rate_cents && (
                      <span className="text-amber-500 font-mono">≥ {formatMoney(pref.min_rate_cents)}</span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(pref.id)} data-testid={`delete-pref-${pref.id}`}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matched Loads */}
        <div>
          <h2 className="font-heading text-lg font-bold uppercase tracking-tight mb-4">
            Matched Loads ({matchedLoads.length})
          </h2>
          {matchedLoads.length === 0 ? (
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-8 text-center">
              <p className="text-zinc-500">No loads match your preferences yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matchedLoads.map((load) => <LoadCard key={load.id} load={load} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
