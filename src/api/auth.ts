const TOKEN_KEY = "holidaze_token";
const PROFILE_KEY = "holidaze_profile";

export interface StoredProfile {
  name: string;
  email: string;
  venueManager: boolean;
  avatar?: { url: string; alt: string };
  banner?: { url: string; alt: string };
}

// ── Token ─────────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export function getStoredProfile(): StoredProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}

export function setStoredProfile(profile: StoredProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function removeStoredProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

// ── Session ───────────────────────────────────────────────────────────────────

/** Clear all stored auth data (call on logout). */
export function clearAuth(): void {
  removeToken();
  removeStoredProfile();
}
