export type FloatingTone = "good" | "bad" | "info" | "gold" | "science";

export type FloatingItem = {
  id: string;
  text: string;
  tone: FloatingTone;
  c: number;
  r: number;
  createdAt: number;
  durationMs: number;
};

// In-memory active floating items queue
let floatingQueue: FloatingItem[] = [];
let seq = 0;

export function addFloating(text: string, tone: FloatingTone, c: number, r: number, durationMs = 1800) {
  seq += 1;
  const item: FloatingItem = {
    id: `fl_${seq}_${Date.now()}`,
    text,
    tone,
    c,
    r,
    createdAt: performance.now(),
    durationMs,
  };
  floatingQueue.push(item);
  // Cap at 30 items
  if (floatingQueue.length > 30) {
    floatingQueue = floatingQueue.slice(-30);
  }
}

export function getActiveFloating(now = performance.now()): { item: FloatingItem; progress: number }[] {
  // Prune expired
  floatingQueue = floatingQueue.filter((item) => now - item.createdAt < item.durationMs);
  return floatingQueue.map((item) => ({
    item,
    progress: (now - item.createdAt) / item.durationMs, // 0 to 1
  }));
}

export function clearFloating() {
  floatingQueue = [];
}
