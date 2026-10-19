'use client';
import { PLATFORM_CONSENT_KEY } from './platform-analytics';
import { isUuid, type ConversionEvent } from './conversion-events';

let queue: ConversionEvent[] = [];
const sent = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;
const sessionKey = 'educalizando_conversion_session_v1';
function accepted() { try { return localStorage.getItem(PLATFORM_CONSENT_KEY) === 'accepted'; } catch { return false; } }
export function clearConversionSession() {
  queue = []; sent.clear(); if (timer) clearTimeout(timer); timer = null;
  try { sessionStorage.removeItem(sessionKey); } catch { /* Storage may be disabled. */ }
}
export function recordConversion(event: ConversionEvent) {
  if (!accepted() || !isUuid(event.storeId) || !isUuid(event.productId)) return;
  const key = `${event.storeId}:${event.productId}:${event.stage}`;
  if (sent.has(key) || queue.some(item => `${item.storeId}:${item.productId}:${item.stage}` === key)) return;
  if (queue.length < 20) queue.push(event);
  if (!timer) timer = setTimeout(() => { timer = null; void flush(); }, 250);
}
async function flush() {
  if (!accepted()) { clearConversionSession(); return; }
  const events = queue; queue = [];
  let sessionId: string;
  try {
    sessionId = sessionStorage.getItem(sessionKey) || crypto.randomUUID();
    sessionStorage.setItem(sessionKey, sessionId);
  } catch { return; }
  try {
    const response = await fetch('/api/catalog-conversion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consent: true, sessionId, events }), keepalive: true });
    if (response.ok && accepted()) for (const event of events) sent.add(`${event.storeId}:${event.productId}:${event.stage}`);
  } catch { /* Optional metrics never block browsing, cart or payment. */ }
}
