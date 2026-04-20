import { useState } from 'react';
import { FileText, DollarSign, Clock, Send, CheckCircle, AlertTriangle, Download, TrendingUp } from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  broker: string;
  loadRef: string;
  amount: number;
  status: 'draft' | 'sent' | 'overdue' | 'paid';
  issueDate: string;
  dueDate: string;
  age: number;
}

const mockInvoices: Invoice[] = [
  { id: '1', number: 'INV-240421-001', broker: 'RXO', loadRef: 'LD-4815', amount: 3200, status: 'paid', issueDate: 'Apr 15', dueDate: 'May 15', age: 0 },
  { id: '2', number: 'INV-240421-002', broker: 'TQL', loadRef: 'LD-4816', amount: 1850, status: 'sent', issueDate: 'Apr 16', dueDate: 'May 16', age: 4 },
  { id: '3', number: 'INV-240421-003', broker: 'Landstar', loadRef: 'LD-4817', amount: 4100, status: 'sent', issueDate: 'Apr 17', dueDate: 'May 17', age: 3 },
  { id: '4', number: 'INV-240418-004', broker: 'Schneider', loadRef: 'LD-4809', amount: 1950, status: 'overdue', issueDate: 'Apr 10', dueDate: 'May 10', age: 10 },
  { id: '5', number: 'INV-240421-005', broker: 'JB Hunt', loadRef: 'LD-4818', amount: 2400, status: 'draft', issueDate: '—', dueDate: '—', age: 0 },
  { id: '6', number: 'INV-240415-006', broker: 'RXO', loadRef: 'LD-4802', amount: 2800, status: 'paid', issueDate: 'Apr 1', dueDate: 'May 1', age: 0 },
];

const statusBadge: Record<string, string> = {
  draft: 'badge-yellow',
  sent: 'badge-blue',
  overdue: 'badge-red',
  paid: 'badge-green',
};

const statusIcon: Record<string, React.ReactNode> = {
  draft: <Clock size={12} />,
  sent: <Send size={12} />,
  overdue: <AlertTriangle size={12} />,
  paid: <CheckCircle size={12} />,
};

const InvoicesPage: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? mockInvoices : mockInvoices.filter((i) => i.status === filter);

  const totalOutstanding = mockInvoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const totalOverdue = mockInvoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage billing and track payments</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <FileText size={16} /> Create Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Outstanding', value: `$${totalOutstanding.toLocaleString()}`, icon: <DollarSign size={18} />, color: 'text-infamous-orange' },
          { label: 'Overdue', value: `$${totalOverdue.toLocaleString()}`, icon: <AlertTriangle size={18} />, color: 'text-red-400' },
          { label: 'Paid This Month', value: '$8,450', icon: <CheckCircle size={18} />, color: 'text-green-400' },
          { label: 'Avg Days to Pay', value: '18 days', icon: <TrendingUp size={18} />, color: 'text-blue-400' },
        ].map((stat, i) => (
          <div key={i} className="card flex items-center gap-3">
            <span className={stat.color}>{stat.icon}</span>
            <div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'draft', 'sent', 'overdue', 'paid'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-infamous-orange text-white' : 'bg-infamous-card text-gray-400 hover:text-white border border-infamous-border'
            }`}
          >
            {f} {f !== 'all' && <span className="text-xs opacity-70">({mockInvoices.filter((i) => i.status === f).length})</span>}
          </button>
        ))}
      </div>

      {/* Invoice Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-infamous-border">
                <th className="table-header">Invoice #</th>
                <th className="table-header">Broker</th>
                <th className="table-header">Load</th>
                <th className="table-header text-right">Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">Issued</th>
                <th className="table-header">Due</th>
                <th className="table-header text-right">Age</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="table-cell font-mono text-xs">{inv.number}</td>
                  <td className="table-cell font-medium">{inv.broker}</td>
                  <td className="table-cell text-xs text-gray-500">{inv.loadRef}</td>
                  <td className="table-cell text-right font-semibold">${inv.amount.toLocaleString()}</td>
                  <td className="table-cell">
                    <span className={`badge ${statusBadge[inv.status]} flex items-center gap-1 w-fit`}>
                      {statusIcon[inv.status]} {inv.status}
                    </span>
                  </td>
                  <td className="table-cell text-xs text-gray-500">{inv.issueDate}</td>
                  <td className="table-cell text-xs text-gray-500">{inv.dueDate}</td>
                  <td className="table-cell text-right">
                    {inv.age > 0 ? (
                      <span className={`text-xs font-medium ${inv.age > 7 ? 'text-red-400' : 'text-yellow-400'}`}>{inv.age}d</span>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-infamous-border text-gray-500 hover:text-white transition-colors">
                        <Download size={14} />
                      </button>
                      {inv.status === 'draft' && (
                        <button className="p-1.5 rounded-lg hover:bg-infamous-border text-gray-500 hover:text-infamous-orange transition-colors">
                          <Send size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
