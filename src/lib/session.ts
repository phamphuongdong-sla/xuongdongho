import type { SessionPayload, SessionUser } from '@/types';

export const SESSION_COOKIE_NAME = 'sowasuco_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'sowasuco_wm_production_secret_key_2026_secure_hmac_sha256';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8Array(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

/**
 * Signs a user object into a tamper-proof HMAC-SHA256 session token.
 * Native Web Crypto API (100% Edge Runtime & Node.js compatible).
 */
export async function signSession(
  user: SessionUser,
  maxAgeSeconds: number = SESSION_MAX_AGE
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...user,
    iat: now,
    exp: now + maxAgeSeconds,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = uint8ArrayToBase64Url(encoder.encode(payloadJson));

  const key = await getCryptoKey('sign');
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies an HMAC-SHA256 session token.
 * Returns the decoded SessionPayload if valid and unexpired, or null otherwise.
 */
export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  try {
    const key = await getCryptoKey('verify');
    const signatureBytes = base64UrlToUint8Array(signatureB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadB64)
    );


    if (!isValid) return null;

    const payloadJson = decoder.decode(base64UrlToUint8Array(payloadB64));
    const payload = JSON.parse(payloadJson) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // Expired token
      return null;
    }

    return payload;
  } catch {
    // Malformed base64 or invalid JSON
    return null;
  }
}

/**
 * Standard cookie options for sowasuco_session
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
};
