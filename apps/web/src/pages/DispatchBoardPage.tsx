import { useState } from 'react';
import { Sparkles, Zap, Truck, Users, ArrowRight, Mic, Clock, AlertTriangle, CheckCircle, Package, FileCheck, MapPin } from 'lucide-react';

type DispatchStatus =
  | 'pending'
  | 'assigned'
  | 'dispatched'
  | 'at_pickup'
  | 'loaded'
  | 'in_transit'
  | 'at_delivery'
  | 'delivered'
  | 'pod_received'
  | 'exception';

interface DispatchLoad {
  id: string;
  ref: string;
  origin: string;
  dest: string;
  status: DispatchStatus;
  carrier?: string;
  driver?: string;
  rate: number;
  eta?: string;
  equipment: string;
}

const mockLoads: DispatchLoad[] = [
  { id: '1', ref: 'LD-4821', origin: 'Chicago, IL', dest: 'Dallas, TX', status: 'pending', rate: 3200, equipment: 'Dry Van' },
  { id: '2', ref: 'LD-4822', origin: 'Atlanta, GA', dest: 'Charlotte, NC', status: 'assigned', carrier: 'Swift Logistics', driver: 'Marcus T.', rate: 1850, equipment: 'Dry Van' },
  { id: '3', ref: 'LD-4823', origin: 'Houston, TX', dest: 'Phoenix, AZ', status: 'dispatched', carrier: 'Desert Haul Co.', driver: 'James R.', rate: 4100, eta: '11:30 PM', equipment: 'Reefer' },
  { id: '4', ref: 'LD-4824', origin: 'Memphis, TN', dest: 'Indianapolis, IN', status: 'at_pickup', carrier: 'Midland Freight', driver: 'David K.', rate: 2400, eta: '4:00 PM', equipment: 'Flatbed' },
  { id: '5', ref: 'LD-4825', origin: 'Denver, CO', dest: 'Kansas City, MO', status: 'loaded', carrier: 'Rocky Road Transport', driver: 'Mike S.', rate: 1950, eta: '8:00 PM', equipment: 'Dry Van' },
  { id: '6', ref: 'LD-4826', origin: 'Seattle, WA', dest: 'Portland, OR', status: 'in_transit', carrier: 'Pacific Freight', driver: 'Tom L.', rate: 1200, eta: '2:00 PM', equipment: 'Dry Van' },
  { id: '7', ref: 'LD-4827', origin: 'Miami, FL', dest: 'Tampa, FL', status: 'at_delivery', carrier: 'Sunshine Carriers', driver: 'Chris B.', rate: 800, eta: '3:30 PM', equipment: 'Dry Van' },
  { id: '8', ref: 'LD-4828', origin: 'Phoenix, AZ', dest: 'Las Vegas, NV', status: 'delivered', carrier: 'Desert Haul Co.', driver: 'Sarah K.', rate: 950, equipment: 'Dry Van' },
  { id: '9', ref: 'LD-4815', origin: 'Dallas, TX', dest: 'Houston, TX', status: 'pod_received', carrier: 'Lone Star Freight', driver: 'Rick J.', rate: 700, equipment: 'Dry Van' },
  { id: '10', ref: 'LD-4816', origin: 'Boston, MA', dest: 'New York, NY', status: 'exception', carrier: 'Northeast Express', driver: 'Paul D.', rate: 1400, equipment: 'Reefer' },
];

const statusConfig: Record<DispatchStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:     { label: 'Pending',     color: 'text-gray-400',            bg: 'bg-gray-500/10 border-gray-500/20',              icon: <Clock size={12} /> },
  assigned:    { label: 'Assigned',    color: 'text-blue-400',            bg: 'bg-blue-500/10 border-blue-500/20',              icon: <Users size={12} /> },
  dispatched:  { label: 'Dispatched',  color: 'text-infamous-orange',     bg: 'bg-infamous-orange/10 border-infamous-orange/20', icon: <Zap size={12} /> },
  at_pickup:   { label: 'At Pickup',   color: 'text-yellow-400',          bg: 'bg-yellow-500/10 border-yellow-500/20',          icon: <Package size={12} /> },
  loaded:      { label: 'Loaded',      color: 'text-cyan-400',            bg: 'bg-cyan-500/10 border-cyan-500/20',              icon: <Truck size={12} /> },
  in_transit:  { label: 'In Transit',  color: 'text-purple-400',          bg: 'bg-purple-500/10 border-purple-500/20',          icon: <ArrowRight size={12} /> },
  at_delivery: { label: 'At Delivery', color: 'text-indigo-400',          bg: 'bg-indigo-500/10 border-indigo-500/20',          icon: <MapPin size={12} /> },  delivered:   { label: 'Delivered',   color: 'text-green-400',           bg: 'bg-green-500/10 border-green-500/20',            icon: <CheckCircle size={12} /> },
  pod_received:{ label: 'POD Received',color: 'text-emerald-400',         bg: 'bg-emerald-500/10 border-emerald-500/20',        icon: <FileCheck size={12} /> },
  exception:   { label: 'Exception',   color: 'text-red-400',             bg: 'bg-red-500/10 border-red-500/20',                icon: <AlertTriangle size={12} /> },
};

const statusColumns: DispatchStatus[] = [
  'pending', 'assigned', 'dispatched', 'at_pickup', 'loaded',
  'in_transit', 'at_delivery', 'delivered', 'pod_received', 'exception',
];

const DispatchBoardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'board' | 'voice'>('board');
  const [isListening, setIsListening] = useState(false);

  const runAutoDispatch = () => {
    // In production: call api.autoDispatch()
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispatch Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">Full load lifecycle — from pending to POD received</p>
        </div>
        <div role="tablist" aria-label="Dispatch view" className="flex gap-2">
          <button
            role="tab"
            aria-selected={activeTab === 'board'}
            aria-controls="dispatch-panel"
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-infamous-orange ${activeTab === 'board' ? 'bg-infamous-orange text-white' : 'bg-infamous-card text-gray-400 hover:text-white'}`}
          >
            Board
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'voice'}
            aria-controls="dispatch-panel"
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-infamous-orange ${activeTab === 'voice' ? 'bg-infamous-orange text-white' : 'bg-infamous-card text-gray-400 hover:text-white'}`}
          >
            <Mic size={14} aria-hidden="true" /> Voice
          </button>
        </div>
      </div>

      {/* AI Banner */}
      <div className="bg-gradient-to-r from-infamous-orange/10 to-purple-500/5 border border-infamous-orange/20 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-infamous-orange/20 flex items-center justify-center">
          <Sparkles size={20} className="text-infamous-orange" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Auto-Dispatch AI Ready</p>
          <p className="text-xs text-gray-400">3 loads waiting for carriers — AI can match them in 90 seconds</p>
        </div>
        <button onClick={runAutoDispatch} className="btn-primary flex items-center gap-2">
          <Zap size={16} /> Run Auto-Dispatch
        </button>
      </div>

      {activeTab === 'board' ? (
        /* Kanban Board — full lifecycle */
        <div id="dispatch-panel" role="tabpanel" className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: `${statusColumns.length * 220}px` }}>
            {statusColumns.map((status) => {
              const colLoads = mockLoads.filter((l) => l.status === status);
              const cfg = statusConfig[status];
              return (
                <div key={status} className="w-52 flex-shrink-0">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 ${cfg.bg}`}>
                    <span className={`${cfg.color}`}>{cfg.icon}</span>
                    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-gray-600 ml-auto">{colLoads.length}</span>
                  </div>
                  <div className="space-y-3">
                    {colLoads.map((load) => (
                      <div key={load.id} className={`card p-3 cursor-pointer hover:border-infamous-orange/30 transition-all ${status === 'exception' ? 'border-red-500/30' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-600">{load.ref}</span>
                          <span className="text-[10px] text-gray-600 ml-auto">{load.equipment}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm mb-2">
                          <span className="font-medium truncate">{load.origin.split(',')[0]}</span>
                          <ArrowRight size={10} className="text-gray-600 flex-shrink-0" />
                          <span className="font-medium truncate">{load.dest.split(',')[0]}</span>
                        </div>
                        {load.carrier && (
                          <div className="text-xs text-gray-500 mb-1 truncate">{load.carrier}</div>
                        )}
                        {load.driver && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <Users size={10} />
                            <span className="truncate">{load.driver}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-infamous-border">
                          <span className="font-bold text-infamous-orange text-sm">${load.rate.toLocaleString()}</span>
                          {load.eta && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={10} /> {load.eta}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {colLoads.length === 0 && (
                      <div className="text-center py-8 text-gray-600 text-xs">No loads</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Voice Booking */
        <div id="dispatch-panel" role="tabpanel" className="max-w-lg mx-auto text-center py-12">
          <button
            onClick={() => setIsListening(!isListening)}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all ${
              isListening
                ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-br from-infamous-orange to-infamous-orange-light hover:scale-105 shadow-xl shadow-infamous-orange/20'
            }`}
          >
            <Mic size={32} className="text-white" />
          </button>
          <h2 className="text-xl font-semibold mb-2">
            {isListening ? 'Listening...' : 'Tap to Start Voice Booking'}
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            {isListening ? 'Say something like "Find me a reefer load near Dallas"' : 'Press and hold the microphone button, then speak your load request'}
          </p>

          {isListening && (
            <div className="flex items-center justify-center gap-1 h-8 mb-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-infamous-orange rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 24 + 8}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="text-left space-y-2 max-w-sm mx-auto">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-3">Try saying:</p>
            {[
              '"Find me a dry van load from Chicago"',
              '"Book the highest paying reefer within 100 miles"',
              '"What backhauls are available near Dallas?"',
              '"Assign Marcus to load LD-4821"',
            ].map((example) => (
              <button
                key={example}
                onClick={() => setIsListening(true)}
                className="w-full text-left text-sm text-gray-400 hover:text-white bg-infamous-card border border-infamous-border hover:border-infamous-orange/30 rounded-lg px-4 py-2.5 transition-all"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchBoardPage;
