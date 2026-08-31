const BASE = '/api/admin';

interface ApiError extends Error {
  status?: number;
}

const request = async <T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  let data: Record<string, unknown> | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error((data?.error as string) || 'Request failed.') as ApiError;
    err.status = res.status;
    throw err;
  }
  return data as unknown as T;
};

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  seeded: boolean;
  createdAt?: string;
  totpSecret?: string;
}

export interface RegisterResponse {
  user: AdminUser;
}

export interface LoginResponse {
  ok: boolean;
  step?: '2fa';
  user?: { id: number; username: string; totpSecret?: string };
}

export interface Verify2faResponse {
  ok: boolean;
  token: string;
  expiresAt: number;
  user: AdminUser;
}

export interface ForgotPasswordResponse {
  ok: boolean;
  devToken?: string;
  expiresInSeconds?: number;
}

export interface SessionResponse {
  user: AdminUser;
}

export const registerAdmin = (input: {
  username: string;
  email: string;
  password: string;
}) =>
  request<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });

export const login = (input: { username: string; password: string }) =>
  request<LoginResponse>('/auth/login', { method: 'POST', body: input });

export const verify2fa = (input: { username: string; code: string }) =>
  request<Verify2faResponse>('/auth/verify-2fa', { method: 'POST', body: input });

export const forgotPassword = (input: { email: string }) =>
  request<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: input,
  });

export const resetPassword = (input: {
  token: string;
  email: string;
  newPassword: string;
}) =>
  request<{ ok: boolean }>('/auth/reset-password', {
    method: 'POST',
    body: input,
  });

export const logout = (token: string) =>
  request<{ ok: boolean }>('/auth/logout', { method: 'POST', token });

export const getSession = (token: string) =>
  request<SessionResponse>('/auth/session', { token });

export const changePassword = (
  token: string,
  input: { currentPassword: string; newPassword: string },
) =>
  request<{ ok: boolean }>('/auth/change-password', {
    method: 'POST',
    body: input,
    token,
  });

export const getTotpSecret = (token: string) =>
  request<{ totpSecret: string; username: string }>('/auth/totp', { token });

export const regenerateTotp = (token: string) =>
  request<{ totpSecret: string; username: string }>('/auth/regenerate-totp', {
    method: 'POST',
    token,
  });

const GALLERY_BASE = '/api/gallery';

export const uploadGalleryImage = async (
  token: string,
  file: File,
): Promise<{ url: string; filename: string }> => {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${GALLERY_BASE}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  let data: { url?: string; filename?: string; error?: string } | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(data?.error || 'Upload failed.') as ApiError;
    err.status = res.status;
    throw err;
  }
  return { url: data!.url!, filename: data!.filename! };
};

export const deleteGalleryImage = async (
  token: string,
  filename: string,
): Promise<void> => {
  const res = await fetch(`${GALLERY_BASE}/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let msg = 'Delete failed.';
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      // ignore
    }
    const err = new Error(msg) as ApiError;
    err.status = res.status;
    throw err;
  }
};

export interface ServerCertCheck {
  certificate: {
    id: string;
    studentId: string;
    programId: string;
    token: string;
    issueDate: string;
    status: string;
    revokedDate?: string;
    revokedReason?: string;
  };
  student: { fullName: string; photo?: string | null };
  program: { title: string; weeks: number; modules: string[] };
  academicRecord: {
    module: string;
    grade: string;
    score: number;
    assessedDate: string;
    assessor: string;
  }[];
}

export const verifyCertificateOnServer = async (
  token: string,
): Promise<ServerCertCheck> => {
  const res = await fetch(`/api/verify/${encodeURIComponent(token)}`);
  let data: { error?: string } & Partial<ServerCertCheck> | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    if (res.status === 404) {
      const err = new Error('Not found') as ApiError;
      err.status = 404;
      throw err;
    }
    const err = new Error(data?.error || 'Verification failed.') as ApiError;
    err.status = res.status;
    throw err;
  }
  return data as unknown as ServerCertCheck;
};

export const syncCertificate = async (
  token: string,
  payload: {
    id: string;
    token: string;
    studentId: string;
    studentName: string;
    studentPhoto?: string | null;
    programId: string;
    programTitle: string;
    programWeeks: number;
    modules: string[];
    issueDate: string;
    status: string;
    assessments: {
      module: string;
      grade: string;
      score: number;
      assessedDate?: string;
      assessor?: string;
    }[];
  },
): Promise<void> => {
  const res = await fetch('/api/admin/certificates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = 'Failed to save certificate.';
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      // ignore
    }
    const err = new Error(msg) as ApiError;
    err.status = res.status;
    throw err;
  }
};
