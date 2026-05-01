import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Wallet } from 'lucide-react';
import api from '@/api-client/client';
import { useAppStore } from '@/store/app-store';

type Settlement = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  netPay: number;
};

const PayrollPage: React.FC = () => {
  const { user } = useAppStore();
  const driverId = useMemo(() => user?.id ?? '1', [user?.id]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPayroll() {
      try {
        const response = await api.getDriverSettlements(driverId) as Settlement[];
        if (mounted) setSettlements(response);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadPayroll();
    return () => {
      mounted = false;
    };
  }, [driverId]);

  const totalNet = settlements.reduce((acc, item) => acc + Number(item.netPay ?? 0), 0);

  return (
    <main className="space-y-4">
      <section className="card">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <p className="mt-1 text-sm text-gray-400">Driver settlements and payout visibility.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <DollarSign className="text-infamous-orange" />
          <p className="mt-2 text-sm text-gray-400">Total Net Pay</p>
          <p className="text-2xl font-black">${totalNet.toFixed(2)}</p>
        </div>
        <div className="card">
          <Wallet className="text-infamous-orange" />
          <p className="mt-2 text-sm text-gray-400">Settlements</p>
          <p className="text-2xl font-black">{settlements.length}</p>
        </div>
      </section>

      <section className="card overflow-x-auto">
        {loading ? <p className="text-sm text-gray-400">Loading payroll…</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="pb-2">Week</th><th className="pb-2">Status</th><th className="pb-2">Net</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((settlement) => (
                <tr key={settlement.id} className="border-t border-infamous-border">
                  <td className="py-3">{new Date(settlement.weekStart).toLocaleDateString()} - {new Date(settlement.weekEnd).toLocaleDateString()}</td>
                  <td className="py-3 capitalize">{settlement.status}</td>
                  <td className="py-3">${Number(settlement.netPay ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
};

export default PayrollPage;
