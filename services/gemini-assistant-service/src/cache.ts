import * as crypto from 'crypto';

export interface ChatMessage {
  role: string;
  parts: { text: string }[];
}

export interface LiveContext {
  nearbyQueues: { queueId: string; estimatedWaitMinutes: number }[];
  crowdedZones: { zoneId: string; densityLevel: string }[];
}

export class GeminiResponseCache {
  private memoryCache: Map<string, {
    response: string,
    cachedAt: number,
    queryHash: string,
    contextVersion: string
  }> = new Map()
  
  private readonly MEMORY_TTL_MS = 30000;
  private readonly MAX_MEMORY_ENTRIES = 100;

  private buildCacheKey(query: string, liveContext: LiveContext): string {
    const normalizedQuery = query.toLowerCase().trim()
    const contextVersion = this.hashContext(liveContext)
    return crypto
      .createHash('md5')
      .update(normalizedQuery + contextVersion)
      .digest('hex')
  }
  
  private hashContext(context: LiveContext): string {
    const volatile = {
      topQueues: context.nearbyQueues
        .slice(0, 5)
        .map(q => ({id: q.queueId, wait: q.estimatedWaitMinutes})),
      criticalZones: context.crowdedZones
        .filter(z => z.densityLevel === 'CRITICAL')
        .map(z => z.zoneId)
    }
    return crypto
      .createHash('md5')
      .update(JSON.stringify(volatile))
      .digest('hex')
  }
  
  async get(query: string, context: LiveContext): Promise<string | null> {
    const key = this.buildCacheKey(query, context)
    
    const memEntry = this.memoryCache.get(key)
    if (memEntry && Date.now() - memEntry.cachedAt < this.MEMORY_TTL_MS) {
      return memEntry.response;
    }
    
    const firestoreEntry = await this.getFromFirestore(key)
    if (firestoreEntry) {
      this.memoryCache.set(key, firestoreEntry)
      return firestoreEntry.response;
    }
    
    return null;
  }
  
  async set(query: string, context: LiveContext, response: string): Promise<void> {
    const key = this.buildCacheKey(query, context)
    const entry = {
      response,
      cachedAt: Date.now(),
      queryHash: key,
      contextVersion: this.hashContext(context)
    }
    
    this.memoryCache.set(key, entry)
    await this.setInFirestore(key, entry)
    
    if (this.memoryCache.size > this.MAX_MEMORY_ENTRIES) {
      const oldest = [...this.memoryCache.entries()]
        .sort((a, b) => a[1].cachedAt - b[1].cachedAt)[0]
      this.memoryCache.delete(oldest[0])
    }
  }

  // Mocks for firestore
  private async getFromFirestore(key: string): Promise<any> { return null; }
  private async setInFirestore(key: string, entry: any): Promise<void> {}
}

const cache = new GeminiResponseCache();

export async function* sendMessage(
  userMessage: string,
  conversationHistory: ChatMessage[],
  liveContext: LiveContext
): AsyncGenerator<string, void, unknown> {
  const isCacheable = conversationHistory.length === 0
  
  if (isCacheable) {
    const cached = await cache.get(userMessage, liveContext)
    if (cached) {
      yield* simulateStream(cached)
      return;
    }
  }
  
  // Cache miss 
  const response = await callGeminiApi(userMessage, conversationHistory, liveContext)
  
  if (isCacheable) {
    await cache.set(userMessage, liveContext, response)
  }
  
  yield response; // streaming fallback
}

// Simulate streaming for cached responses
export async function* simulateStream(cachedResponse: string): AsyncGenerator<string, void, unknown> {
  const words = cachedResponse.split(' ')
  const WORDS_PER_CHUNK = 3
  for (let i = 0; i < words.length; i += WORDS_PER_CHUNK) {
    yield words.slice(i, i + WORDS_PER_CHUNK).join(' ') + ' '
    await new Promise(r => setTimeout(r, 30))
  }
}

async function callGeminiApi(message: string, history: any[], context: any): Promise<string> {
    return "Mock LLM Response";
}
