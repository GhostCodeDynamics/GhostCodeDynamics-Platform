const STORAGE_KEY = "gcd_guest_name";

const ADJECTIVES = ["Cobalt", "Velvet", "Neon", "Solar", "Nimbus", "Amber", "Ember", "Static"];
const NOUNS = ["Fox", "Raven", "Otter", "Heron", "Lynx", "Cobra", "Falcon", "Orca"];

function generateGuestName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${adj}${noun}${num}`;
}

/**
 * Stable per-browser guest identity, persisted in localStorage so comments
 * posted from this device share one name (and get the "You" badge). Falls
 * back to Anonymous when storage is unavailable (private mode / SSR).
 */
export function getGuestName() {
  try {
    if (typeof window === "undefined") return null;
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const name = generateGuestName();
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
      /* quota / private mode — the session still uses the generated name */
    }
    return name;
  } catch {
    return null;
  }
}