import { useState } from 'react';
import { Sparkles, Zap, Truck, Users, ArrowRight, Mic, Phone, Target, Clock } from 'lucide-react';

interface DispatchLoad {
  id: string;
  ref: string;
  origin: string;
  dest: string;
  status: 'available' | 'matching' | 'assigned' | 'in_transit' | 'delivered';
  driver?: string;
  driverHOS?: number;
  rate: number;
  eta?: string;
  equipment: string;
}

const mockLoads: DispatchLoad[] = [
  { id: '1', ref: 'LD-4821', origin: 'Chicago, IL', dest: 'Dallas, TX', status: 'available', rate: 3200, equipment: 'Dry Van' },
  { id: '2', ref: 'LD-4822', origin: 'Atlanta, GA', dest: 'Charlotte, NC', status: 'matching', rate: 1850, equipment: 'Dry Van' },
  { id: '3', ref: 'LD-4823', origin: 'Houston, TX', dest: 'Phoenix, AZ', status: 'assigned', driver: 'Marcus T.', driverHOS: 6.2, rate: 4100, eta: '11:30 PM', equipment: 'Reefer' },
  { id: '4', ref: 'LD-4824', origin: 'Memphis, TN', dest: 'Indianapolis, IN', status: 'in_transit', driver: 'James R.', driverHOS: 4.1, rate: 2400, eta: '4:00 PM', equipment: 'Flatbed' },
  { id: '5', ref: 'LD-4825', origin: 'Denver, CO', dest: 'Kansas City, MO', status: 'delivered', driver: 'David K.', rate: 1950, equipment: 'Dry Van' },
  { id: '6', ref: 'LD-4826', origin: 'Seattle, WA', dest: 'Portland, OR', status: 'available', rate: 1200, equipment: 'Dry Van' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Available', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  matching: { label: 'AI Matching', color: 'text-infamous-orange', bg: 'bg-infamous-orange/10 border-infamous-orange/20' },
  assigned: { label: 'Assigned', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  in_transit: { label: 'In Transit', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  delivered: { label: 'Delivered', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
};

const statusColumns = ['available', 'matching', 'assigned', 'in_transit', 'delivered'];

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
          <p className="text-sm text-gray-500 mt-0.5">Drag and drop, or let AI do the work</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'board' ? 'bg-infamous-orange text-white' : 'bg-infamous-card text-gray-400 hover:text-white'}`}
          >
            Board
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'voice' ? 'bg-infamous-orange text-white' : 'bg-infamous-card text-gray-400 hover:text-white'}`}
          >
            <Mic size={14} /> Voice
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
          <p className="text-xs text-gray-400">3 loads waiting for drivers — AI can match them in 90 seconds</p>
        </div>
        <button onClick={runAutoDispatch} className="btn-primary flex items-center gap-2">
          <Zap size={16} /> Run Auto-Dispatch
        </button>
      </div>

      {activeTab === 'board' ? (
        /* Kanban Board */
        <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-2">
          {statusColumns.map((status) => {
            const colLoads = mockLoads.filter((l) => l.status === status);
            const cfg = statusConfig[status];
            return (
              <div key={status} className="min-w-[220px]">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 ${cfg.bg}`}>
                  <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs text-gray-600 ml-auto">{colLoads.length}</span>
                </div>
                <div className="space-y-3">
                  {colLoads.map((load) => (
                    <div key={load.id} className="card p-4 cursor-grab hover:border-infamous-orange/30 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-600">{load.ref}</span>
                        <span className="text-[10px] text-gray-600 ml-auto">{load.equipment}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <span className="font-medium">{load.origin.split(',')[0]}</span>
                        <ArrowRight size={12} className="text-gray-600" />
                        <span className="font-medium">{load.dest.split(',')[0]}</span>
                      </div>
                      {load.driver && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <Users size={10} />
                          <span>{load.driver}</span>
                          {load.driverHOS && (
                            <span className={`ml-auto ${load.driverHOS < 2 ? 'text-red-400' : load.driverHOS < 4 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {load.driverHOS}h HOS
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-infamous-border">
                        <span className="font-bold text-infamous-orange">${load.rate.toLocaleString()}</span>
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
      ) : (
        /* Voice Booking */
        <div className="max-w-lg mx-auto text-center py-12">
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
