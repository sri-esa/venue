import { Bot, Minimize2, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { buildVenueContext, sendGeminiMessage } from '../../services/api/gemini';
import type { ChatMessage } from '../../services/api/gemini';
import { useAlertStore } from '../../store/alert.store';
import { useCrowdStore } from '../../store/crowd.store';
import { useQueueStore } from '../../store/queue.store';
import { mockAlerts, mockQueues, mockZones } from '../../config/mock-data';

const SUGGESTED_PROMPTS = [
  'Which zones are at critical density?',
  'What are the longest queues right now?',
  'Any urgent alerts I should know about?',
  'Recommend crowd redistribution actions.',
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-venue-blue/20">
        <Bot className="h-3.5 w-3.5 text-venue-blue" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-navy-elevated px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-venue-blue/20">
          <Bot className="h-3.5 w-3.5 text-venue-blue" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-venue-blue text-white'
            : 'rounded-bl-sm bg-navy-elevated text-slate-200'
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

/**
 * Floating Gemini AI chat assistant — available on every page.
 * Injects live zone, queue and alert data as context into every Gemini request.
 */
export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pull live data from stores, fall back to mock data if Firestore hasn't loaded
  const storeZones = useCrowdStore(useShallow((s) => Object.values(s.zones)));
  const storeQueues = useQueueStore(useShallow((s) => Object.values(s.queues)));
  const storeAlerts = useAlertStore(useShallow((s) => Object.values(s.alerts)));

  const zones = storeZones.length ? storeZones : mockZones;
  const queues = storeQueues.length ? storeQueues : mockQueues;
  const alerts = storeAlerts.length ? storeAlerts : mockAlerts;

  useEffect(() => {
    if (open && !minimised) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [history, open, minimised]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', text: text.trim() };
    setHistory((h) => [...h, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = buildVenueContext(zones, queues, alerts);
      const reply = await sendGeminiMessage(history, text.trim(), context);
      setHistory((h) => [...h, { role: 'model', text: reply }]);
    } catch {
      setHistory((h) => [...h, { role: 'model', text: '⚠️ Failed to reach Gemini. Check your API key.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimised(false); }}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-venue-blue shadow-lg shadow-venue-blue/40 transition hover:scale-105 hover:bg-blue-500 active:scale-95"
          aria-label="Open AI assistant"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex w-[360px] flex-col rounded-2xl border border-navy-border bg-navy-card shadow-2xl shadow-black/40 transition-all duration-200 ${
            minimised ? 'h-14' : 'h-[520px]'
          }`}
        >
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between rounded-t-2xl border-b border-navy-border bg-navy-elevated px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-venue-blue/20">
                <Sparkles className="h-3.5 w-3.5 text-venue-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Crowgy AI</p>
                <p className="text-xs text-slate-500">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimised((m) => !m)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                aria-label={minimised ? 'Expand' : 'Minimise'}
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!minimised && (
            <>
              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {history.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-center text-xs text-slate-500">
                      Ask me anything about live venue conditions.
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {SUGGESTED_PROMPTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => sendMessage(p)}
                          className="rounded-xl border border-navy-border bg-navy-elevated px-3 py-2 text-left text-xs text-slate-300 transition hover:border-venue-blue/40 hover:bg-venue-blue/10 hover:text-slate-100"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {history.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}

                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-navy-border p-3">
                <div className="flex items-center gap-2 rounded-xl border border-navy-border bg-navy-elevated px-3 py-2 focus-within:border-venue-blue/60 focus-within:ring-1 focus-within:ring-venue-blue/30">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about crowd, queues, alerts…"
                    className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-600 outline-none"
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-venue-blue text-white transition hover:bg-blue-500 disabled:opacity-40"
                    aria-label="Send"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
