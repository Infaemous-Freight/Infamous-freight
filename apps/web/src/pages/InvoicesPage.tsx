import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, DollarSign, FileText, RefreshCw, Send, TrendingUp } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/api-client/client';

type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid';

interface Invoice {
  id: string;
  invoiceNumber: string;
  brokerName: string;
  loadId: string;
  amount: number;
  status: InvoiceStatus;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
}

const statusBadge: Record<InvoiceStatus, string> = {
  draft: 'badge-yellow',
  sent: 'badge-blue',
  overdue: 'badge-red',
  paid: 'badge-green',
};

const statusIcon: Record<InvoiceStatus, React.ReactNode> = {
  draft: <span>•</span>,
  sent: <Send size={12} />,
  overdue: <AlertTriangle size={12} />,
  paid: <CheckCircle size={12} />,
};

function money(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function date(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
}

const InvoicesPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.getInvoices();
      const records = Array.isArray(response?.data) ? response.data as Invoice[] : [];
      setInvoices(records);
    } catch {
      setError(true);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchInvoices(); }, [fetchInvoices]);

  const visible = useMemo(
    () => filter === 'all' ? invoices : invoices.filter((invoice) => invoice.status === filter),
    [filter, invoices],
  );

  const outstanding = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount || 0), 0);
  const overdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + Number(i.amount || 0), 0);
  const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
  const counts = (status: InvoiceStatus) => invoices.filter((invoice) => invoice.status === status).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-[#B88989]/70 mt-0.5">Live tenant billing records from the Infamous Freight API.</p>
        </div>
        <button type="button" onClick={() => void fetchInvoices()} className="btn-secondary flex items-center gap-2" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Outstanding', value: money(outstanding), icon: <DollarSign size={18} /> },
          { label: 'Overdue', value: money(overdue), icon: <AlertTriangle size={18} /> },
          { label: 'Paid', value: money(paid), icon: <CheckCircle size={18} /> },
          { label: 'Invoice count', value: String(invoices.length), icon: <TrendingUp size={18} /> },
        ].map((stat) => (
          <div key={stat.label} className="card flex items-center gap-3">
            <span className="text-infamous-orange">{stat.icon}</span>
            <div><p className="text-lg font-bold">{stat.value}</p><p className="text-xs text-[#B88989]/70">{stat.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'draft', 'sent', 'overdue', 'paid'] as const).map((status) => (
          <button
            type="button"
            key={status}
            onClick={() => setFilter(status)}
            aria-pressed={filter === status}
            className={\`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all \${filter === status ? 'bg-infamous-orange text-[#F5E8E8]' : 'bg-infamous-card text-[#B88989] hover:text-[#F5E8E8] border border-infamous-border'}\`}
          >
            {status} {status !== 'all' && <span className="text-xs opacity-70">({counts(status)})</span>}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#B88989]/70">Loading live invoices…</div>
        ) : error ? (
          <EmptyState icon={<FileText size={40} />} title="Invoice service unavailable" description="The live invoice API could not be reached. No sample invoices are shown." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-infamous-border">
                <th className="table-header">Invoice #</th><th className="table-header">Broker</th><th className="table-header">Load</th>
                <th className="table-header text-right">Amount</th><th className="table-header">Status</th><th className="table-header">Created</th>
                <th className="table-header">Due</th><th className="table-header"></th>
              </tr></thead>
              <tbody>
                {visible.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-infamous-panel transition-colors">
                    <td className="table-cell font-mono text-xs">{invoice.invoiceNumber}</td>
                    <td className="table-cell font-medium">{invoice.brokerName || '—'}</td>
                    <td className="table-cell text-xs text-[#B88989]/70">{invoice.loadId}</td>
                    <td className="table-cell text-right font-semibold">{money(Number(invoice.amount || 0))}</td>
                    <td className="table-cell"><span className={\`badge \${statusBadge[invoice.status] ?? 'badge-blue'} flex items-center gap-1 w-fit\`}>{statusIcon[invoice.status] ?? '•'} {invoice.status}</span></td>
                    <td className="table-cell text-xs text-[#B88989]/70">{date(invoice.createdAt)}</td>
                    <td className="table-cell text-xs text-[#B88989]/70">{date(invoice.dueDate)}</td>
                    <td className="table-cell text-right">{invoice.status === 'draft' && <button type="button" className="p-1.5 rounded-lg hover:bg-infamous-border text-[#B88989]/70 hover:text-infamous-orange" aria-label={\`Send invoice \${invoice.invoiceNumber}\`}><Send size={14} /></button>}</td>
                  </tr>
                ))}
                {visible.length === 0 && <tr><td colSpan={8}><EmptyState icon={<FileText size={40} />} title="No live invoices" description="Invoices will appear here after a real load is billed. Sample billing data has been removed." /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;
