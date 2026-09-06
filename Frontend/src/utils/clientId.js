/**
 * clientId — persistent anonymous visitor ID used as the API `actorId`.
 *
 * - persisted to localStorage under a fixed key
 * - preferred source: crypto.randomUUID()
 * - safe fallback for browsers without randomUUID
 * - never derived from email, name, phone, IP or browser fingerprint
 * - never displayed in the UI, never logged
 * - satisfies the backend 8–128 character requirement
 */

const STORAGE_KEY = "ghostcode.client.id.v1";
const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

let cachedId = null;

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `ghostcode-${crypto.randomUUID()}`;
  }
  const bytes = new Uint32Array(4);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = (Math.random() * 0x100000000) >>> 0;
    }
  }
  const hex = Array.from(bytes, (n) => n.toString(16).padStart(8, "0")).join("");
  return `ghostcode-${hex}`;
}

export function getClientId() {
  if (cachedId) return cachedId;

  if (typeof window !== "undefined") {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      if (existing && existing.length >= MIN_LENGTH && existing.length <= MAX_LENGTH) {
        cachedId = existing;
        return cachedId;
      }
    } catch {
      // storage unavailable — fall through to a fresh session id
    }
  }

  cachedId = generateId();

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, cachedId);
    } catch {
      // storage unavailable — id stays stable for this session only
    }
  }

  return cachedId;
}

export default getClientId;
