/**
 * One-time move from the old "omnipos:" storage keys to "karyano:".
 * Existing installs keep their sign-in, server address, onboarding state and any unsynced offline sales.
 * Imported first in main.tsx so it runs before any module reads storage.
 */
try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("omnipos:")) continue;
    const next = "karyano:" + key.slice("omnipos:".length);
    const value = localStorage.getItem(key);
    if (value !== null && localStorage.getItem(next) === null) localStorage.setItem(next, value);
    localStorage.removeItem(key);
  }
} catch {
  /* storage unavailable: nothing to migrate */
}
export {};
