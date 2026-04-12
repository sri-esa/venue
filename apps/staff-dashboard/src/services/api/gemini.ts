import type { ZoneDensity } from '../../types/crowd.types';
import type { QueueStatus } from '../../types/queue.types';
import type { SystemAlert } from '../../types/alert.types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? '';
// gemini-2.0-flash-lite: lowest quota usage, available on this project's key
const GEMINI_MODEL = 'gemini-2.0-flash-lite';
const API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Builds a concise system context string from live venue data.
 * Injected into every Gemini request so the model understands current conditions.
 */
export function buildVenueContext(
  zones: ZoneDensity[],
  queues: QueueStatus[],
  alerts: SystemAlert[]
): string {
  const criticalZones = zones.filter((z) => z.densityLevel === 'CRITICAL');
  const highZones = zones.filter((z) => z.densityLevel === 'HIGH');
  const openQueues = queues.filter((q) => q.isOpen);
  const activeAlerts = alerts.filter((a) => !a.resolvedAt);

  const zoneLines = zones
    .map((z) => `  • ${z.zoneId}: ${z.densityLevel} (${Math.round(z.occupancy * 100)}% of ${z.capacity})`)
    .join('\n');

  const queueLines = openQueues
    .map((q) => `  • Queue ${q.queueId}: ${q.estimatedWaitMinutes} min wait, ${q.currentLength} people`)
    .join('\n') || '  • No open queues';

  const alertLines = activeAlerts
    .slice(0, 5)
    .map((a) => `  • [${a.severity}] ${a.message}`)
    .join('\n') || '  • No active alerts';

  return `You are Crowgy AI, an intelligent operations assistant for a 50,000-seat sports venue.
You have access to real-time venue data updated live. Answer concisely and actionably.

CURRENT VENUE STATUS:
Zones (${zones.length} total, ${criticalZones.length} CRITICAL, ${highZones.length} HIGH):
${zoneLines || '  • No zone data available'}

Queues (${openQueues.length} open):
${queueLines}

Active Alerts (${activeAlerts.length}):
${alertLines}

Answer in 2–4 sentences. Prioritise safety and crowd management. If asked about specific zones or queues, use the data above.`;
}

/**
 * Sends a message to Gemini and returns the full response text.
 * Uses the REST API directly so no Node.js SDK is needed in the browser.
 */
export async function sendGeminiMessage(
  history: ChatMessage[],
  userMessage: string,
  systemContext: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return '⚠️ Gemini API key not configured. Set VITE_GEMINI_API_KEY in your environment.';
  }

  // Build Gemini contents array from history + new message
  const contents = [
    // Inject venue context as first user turn (Gemini 1.5 doesn't have a system role in REST)
    { role: 'user', parts: [{ text: systemContext }] },
    { role: 'model', parts: [{ text: 'Understood. I have the live venue data. How can I help?' }] },
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 512,
        topP: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const status = response.status;
    if (status === 429) {
      return '⚠️ Gemini quota exceeded for today. The free tier limit has been reached — responses will resume tomorrow or after upgrading the API plan.';
    }
    console.error('Gemini API error', err);
    return `⚠️ Gemini API error (${status}). Check the console for details.`;
  }

  const data = await response.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '(no response)';
  return text;
}
