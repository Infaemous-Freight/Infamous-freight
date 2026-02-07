import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadsApi } from '@/lib/api';
import { LoadCard } from '@/components/LoadCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Plus, Loader2, AlertCircle, Filter } from 'lucide-react';

export default function LoadsPage() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchLoads = async () => {
      setLoading(true);
      setError(null);
      try {
        const status = statusFilter === 'all' ? undefined : statusFilter;
        const res = await loadsApi.list(status);
        setLoads(res.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load loads');
      } finally {
        setLoading(false);
      }
    };

    fetchLoads();
  }, [statusFilter]);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
              Available Loads
            </h1>
            <p className="text-zinc-500 mt-1">Browse and bid on freight loads</p>
          </div>
          <Link to="/loads/new">
            <Button className="gap-2" data-testid="post-load-btn">
              <Plus className="h-4 w-4" />
              Post a Load
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-[#121217] border border-zinc-800 rounded-sm">
          <Filter className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-500">Filter by status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-zinc-950 border-zinc-800" data-testid="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800">
              <SelectItem value="all">All Loads</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-center gap-2 p-4 bg-red-950/50 border border-red-800 rounded-sm text-red-400">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && loads.length === 0 && (
          <div className="text-center py-20">
            <div className="p-4 bg-zinc-900 rounded-sm w-fit mx-auto mb-4">
              <Package className="h-10 w-10 text-zinc-500" />
            </div>
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight mb-2">
              No Loads Found
            </h2>
            <p className="text-zinc-500 mb-6">
              {statusFilter !== 'all'
                ? 'No loads match your filter criteria.'
                : 'No loads have been posted yet.'}
            </p>
            <Link to="/loads/new">
              <Button data-testid="empty-post-load">Post the First Load</Button>
            </Link>
          </div>
        )}

        {/* Loads List */}
        {!loading && !error && loads.length > 0 && (
          <div className="space-y-4">
            {loads.map((load) => (
              <LoadCard key={load.id} load={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
