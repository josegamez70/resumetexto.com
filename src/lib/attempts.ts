// src/lib/attempts.ts

const KEY = (uid: string) => `rt_attempts:${uid}`;

export function getAttempts(uid: string): number {
  try {
    return parseInt(localStorage.getItem(KEY(uid)) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function incAttempt(uid: string): number {
  try {
    const n = getAttempts(uid) + 1;
    localStorage.setItem(KEY(uid), String(n));
    return n;
  } catch {
    return 0;
  }
}

export function resetAttempts(uid: string): void {
  try {
    localStorage.removeItem(KEY(uid));
  } catch {}
}
