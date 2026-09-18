import { FormEvent, useState } from 'react';
import { ArrowLeft, Bot, CheckCircle2, ClipboardList, Loader2, MessageSquareText, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getConfiguredApiBaseUrl } from '@/lib/apiBase';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const starterText = 'Customer needs a 53 ft dry van from Chicago, IL to Dallas, TX. Pickup is tomorrow morning. Freight is palletized retail goods, 24,000 lb, no hazmat, delivery required next day by 6 PM.';

const quickPrompts = [
  'Turn this request into a quote checklist.',
  'What information is still missing?',
  'What should dispatch verify before assigning a carrier?',
];

async function streamGenesis(messages: ChatMessage[], onToken: (token: string) => void): Promise<void> {
  const token = localStorage.getItem('infamous_token');
  const response = await fetch(\`\${getConfiguredApiBaseUrl()}/chat\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || 'Genesis is unavailable right now.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\\n\\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const dataLine = event.split('\\n').find((line) => line.startsWith('data:'));
      if (!dataLine) continue;
      const data = dataLine.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data) as { content?: string };
        if (parsed.content) onToken(parsed.content);
      } catch {
        // Ignore malformed SSE frames; the stream will continue.
      }
    }
  }
}

const FreightAssistantPage: React.FC = () => {
  const [input, setInput] = useState(starterText);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const analyzeLocally = () => {
    const text = input.toLowerCase();
    const hasOrigin = /(chicago|atlanta|houston|origin|pickup)/.test(text);
    const hasDestination = /(dallas|charlotte|phoenix|destination|delivery)/.test(text);
    const hasEquipment = /(dry van|reefer|flatbed|equipment)/.test(text);
    const hasWeight = /(\blb\b|pound|weight)/.test(text);
    const hasTiming = /(tomorrow|today|pickup|delivery|am|pm|window|deadline)/.test(text);

    return {
      checks: [hasOrigin, hasDestination, hasEquipment, hasWeight, hasTiming],
      nextSteps: [
        hasOrigin && hasDestination ? 'Confirm lane mileage and pickup/delivery windows.' : 'Collect complete origin and destination details.',
        hasEquipment ? 'Validate equipment type and accessorial requirements.' : 'Confirm required equipment type.',
        hasWeight ? 'Check carrier capacity against freight weight and dimensions.' : 'Request weight, dimensions, and pallet count.',
        'Verify carrier authority, insurance, and eligibility before assignment.',
        'Quote the lane, document assumptions, and assign a dispatcher follow-up owner.',
      ],
    };
  };

  const analysis = analyzeLocally();

  const sendMessage = async (event?: FormEvent, preset?: string) => {
    event?.preventDefault();
    const content = (preset ?? chatInput).trim();
    if (!content || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setChatInput('');
    setSending(true);
    setError('');

    try {
      let assistant = '';
      await streamGenesis(nextMessages, (token) => {
        assistant += token;
        setMessages([...nextMessages, { role: 'assistant', content: assistant }]);
      });
    } catch (err) {
      setMessages(nextMessages);
      setError(err instanceof Error ? err.message : 'Genesis could not respond.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] px-4 py-6 text-[#F5E8E8] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link to="/home" className="mb-6 inline-flex items-center gap-2 text-sm text-[#B88989] hover:text-[#F5E8E8]">
          <ArrowLeft aria-hidden="true" size={16} /> Back to Infamous Freight
        </Link>

        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-infamous-orange/30 bg-infamous-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-infamous-orange">
              <Sparkles size={14} /> Genesis AI
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">AI freight operations assistant</h1>
            <p className="mt-2 max-w-3xl text-[#B88989]">
              Turn unstructured freight requests into operational next steps, then ask Genesis what to do next.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-infamous-border bg-infamous-card px-4 py-3 text-xs text-[#B88989]">
            <ShieldCheck size={16} className="text-green-400" />
            Human approval stays required for binding freight, carrier, compliance, and financial actions.
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-infamous-border bg-infamous-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <MessageSquareText className="text-infamous-orange" size={22} />
                <h2 className="text-xl font-bold">Freight intake</h2>
              </div>
              <textarea
                aria-label="Freight request input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-h-56 w-full rounded-2xl border border-infamous-border bg-infamous-panel p-4 text-sm leading-6 outline-none focus:border-infamous-orange"
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-5">
                {analysis.checks.map((ready, index) => (
                  <div key={index} className="rounded-xl border border-infamous-border bg-infamous-panel p-3 text-center">
                    <CheckCircle2 className={ready ? 'mx-auto text-green-400' : 'mx-auto text-[#6F5B5B]'} size={18} />
                    <p className="mt-2 text-[11px] text-[#B88989]">{['Origin', 'Destination', 'Equipment', 'Weight', 'Timing'][index]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-infamous-border bg-infamous-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <ClipboardList className="text-infamous-orange" size={22} />
                <h2 className="text-xl font-bold">Dispatch readiness</h2>
                <span className="ml-auto text-2xl font-bold">{analysis.checks.filter(Boolean).length}/5</span>
              </div>
              <div className="space-y-3">
                {analysis.nextSteps.map((step) => (
                  <div key={step} className="flex gap-3 rounded-2xl border border-infamous-border bg-infamous-panel p-4">
                    <CheckCircle2 className="mt-0.5 flex-shrink-0 text-green-400" size={18} />
                    <p className="text-sm leading-6 text-[#F5E8E8]/80">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-h-[620px] flex-col rounded-3xl border border-infamous-border bg-infamous-card p-5">
            <div className="mb-4 flex items-center gap-3 border-b border-infamous-border pb-4">
              <div className="rounded-xl bg-infamous-orange/10 p-2 text-infamous-orange"><Bot size={22} /></div>
              <div>
                <h2 className="font-bold">Ask Genesis</h2>
                <p className="text-xs text-[#B88989]">AI-assisted freight reasoning</p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-infamous-border bg-infamous-panel p-6">
                  <p className="font-semibold">Start with a freight question.</p>
                  <div className="mt-4 space-y-2">
                    {quickPrompts.map((prompt) => (
                      <button key={prompt} onClick={() => void sendMessage(undefined, prompt)} className="block w-full rounded-xl border border-infamous-border px-4 py-3 text-left text-sm text-[#B88989] hover:border-infamous-orange hover:text-[#F5E8E8]">
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={message.role === 'user' ? 'ml-8 rounded-2xl bg-infamous-orange/10 p-4' : 'mr-8 rounded-2xl border border-infamous-border bg-infamous-panel p-4'}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-infamous-orange">{message.role === 'user' ? 'You' : 'Genesis'}</p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.content || (sending ? 'Genesis is thinking…' : '')}</p>
                </div>
              ))}

              {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">{error}</div>}
            </div>

            <form onSubmit={(event) => void sendMessage(event)} className="mt-4 border-t border-infamous-border pt-4">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ask Genesis about this freight..."
                  className="min-w-0 flex-1 rounded-2xl border border-infamous-border bg-infamous-panel px-4 py-3 text-sm outline-none focus:border-infamous-orange"
                  disabled={sending}
                />
                <button type="submit" disabled={sending || !chatInput.trim()} className="rounded-2xl bg-infamous-orange px-4 py-3 font-semibold text-black disabled:opacity-40">
                  {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FreightAssistantPage;
