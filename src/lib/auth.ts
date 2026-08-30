import { useSyncExternalStore } from 'react';
import * as api from './api';

export interface AdminAccount {
  id: number;
  username: string;
  email: string;
  role: string;
  seeded: boolean;
  totpSecret?: string;
  createdAt?: string;
}

export interface AuthState {
  token: string;
  expiresAt: number;
  user: AdminAccount;
}

interface AuthData {
  session: AuthState | null;
  pending2faUser: string | null;
  pending2faSecret?: string | null;
}

const STORAGE_KEY = 'ksb-admin-auth-v1';

let data: AuthData | null = null;
const listeners = new Set<() => void>();

const load = (): AuthData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthData;
      if (parsed.session && parsed.session.expiresAt <= Date.now()) {
        parsed.session = null;
      }
      return parsed;
    }
  } catch {
    // fall through
  }
  return { session: null, pending2faUser: null, pending2faSecret: null };
};

data = load();

const commit = (next: AuthData): void => {
  data = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage may be unavailable; keep in-memory state
  }
  listeners.forEach((l) => l());
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const hasValidSession = (): boolean => {
  const s = data?.session;
  return Boolean(s && s.expiresAt > Date.now());
};

export const getSnapshot = (): boolean => hasValidSession();

export const useAuth = (): boolean => useSyncExternalStore(subscribe, getSnapshot);

export interface LoginResult {
  ok: boolean;
  error?: string;
  step?: '2fa';
}

export const login = async (username: string, password: string): Promise<LoginResult> => {
  try {
    const res = await api.login({ username, password });
    if (res.ok && res.step === '2fa' && res.user) {
      const current = data ?? load();
      commit({
        ...current,
        pending2faUser: res.user.username,
        pending2faSecret: res.user.totpSecret ?? null,
      });
      return { ok: true, step: '2fa' };
    }
    return { ok: false, error: 'Login failed.' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Login failed.' };
  }
};

export const verify2fa = async (
  code: string,
): Promise<{ ok: boolean; error?: string }> => {
  const current = data ?? load();
  const username = current.pending2faUser;
  if (!username) {
    return { ok: false, error: 'Please start from the login form first.' };
  }
  try {
    const res = await api.verify2fa({ username, code });
    const session: AuthState = {
      token: res.token,
      expiresAt: res.expiresAt,
      user: res.user,
    };
    commit({ session, pending2faUser: null, pending2faSecret: null });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Verification failed.' };
  }
};

export const logout = async (): Promise<void> => {
  const current = data ?? load();
  const token = current.session?.token;
  if (token) {
    try {
      await api.logout(token);
    } catch {
      // ignore network errors on logout
    }
  }
  commit({ session: null, pending2faUser: null, pending2faSecret: null });
};

export interface PasswordChangeResult {
  ok: boolean;
  error?: string;
}

export const changePassword = async (
  current: string,
  next: string,
): Promise<PasswordChangeResult> => {
  const current2 = data ?? load();
  const token = current2.session?.token;
  if (!token) return { ok: false, error: 'You must be signed in.' };
  try {
    await api.changePassword(token, { currentPassword: current, newPassword: next });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not change the password.' };
  }
};

export const registerAdmin = async (input: {
  username: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; error?: string; user?: AdminAccount }> => {
  try {
    const res = await api.registerAdmin(input);
    return { ok: true, user: res.user };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Registration failed.' };
  }
};

export type ForgotResult = {
  ok: boolean;
  error?: string;
  devToken?: string;
  expiresInSeconds?: number;
};

export const requestPasswordReset = async (email: string): Promise<ForgotResult> => {
  try {
    const res = await api.forgotPassword({ email });
    return { ok: true, devToken: res.devToken, expiresInSeconds: res.expiresInSeconds };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Request failed.' };
  }
};

export const completePasswordReset = async (input: {
  token: string;
  email: string;
  newPassword: string;
}): Promise<{ ok: boolean; error?: string }> => {
  try {
    await api.resetPassword(input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Password reset failed.' };
  }
};

export const isPending2fa = (): boolean => {
  const current = data ?? load();
  return Boolean(current.pending2faUser);
};

export const getPending2faSecret = (): string | null => {
  const current = data ?? load();
  return current.pending2faSecret ?? null;
};

export const getAccount = (): AdminAccount | null => {
  const current = data ?? load();
  return current.session?.user ?? null;
};

export const getToken = (): string | null => {
  const current = data ?? load();
  return current.session?.token ?? null;
};

export const fetchTotpSecret = async (): Promise<{ secret: string; username: string } | null> => {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await api.getTotpSecret(token);
    return { secret: res.totpSecret, username: res.username };
  } catch {
    return null;
  }
};

export const regenerate2fa = async (): Promise<{ secret: string; username: string } | null> => {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await api.regenerateTotp(token);
    return { secret: res.totpSecret, username: res.username };
  } catch {
    return null;
  }
};

export interface TotpSecretRef {
  username: string;
  totpSecret: string;
}

let setupSecret: TotpSecretRef | null = null;

export const getSetupSecret = (): TotpSecretRef | null => setupSecret;

export const setSetupSecret = (ref: TotpSecretRef | null): void => {
  setupSecret = ref;
};

export const currentTotpCode = async (secret: string): Promise<string> => {
  const counter = Math.floor(Date.now() / 1000 / 30);
  const message = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    message[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = secret.toUpperCase().replace(/=+$/g, '');
  let bits = '';
  for (const ch of clean) {
    const value = BASE32.indexOf(ch);
    if (value < 0) continue;
    bits += value.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  const key = await crypto.subtle.importKey(
    'raw',
    bytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, message));
  const offset = signature[signature.length - 1] & 0x0f;
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    (signature[offset + 1] << 16) |
    (signature[offset + 2] << 8) |
    signature[offset + 3];
  return String(binary % 1_000_000).padStart(6, '0');
};

export const otpSecondsLeft = (): number => 30 - (Math.floor(Date.now() / 1000) % 30);

export const otpauthURL = (username: string, secret: string): string =>
  `otpauth://totp/The%20Kigali%20Specialist%20Barista:${encodeURIComponent(username)}?secret=${secret}&issuer=The%20Kigali%20Specialist%20Barista&digits=6&period=30`;