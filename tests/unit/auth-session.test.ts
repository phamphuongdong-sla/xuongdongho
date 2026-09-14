import { describe, it, expect } from 'vitest';
import { signSession, verifySession } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/auth';
import type { SessionUser } from '@/types';

describe('Web Crypto HMAC-SHA256 Stateless Session Engine', () => {
  const sampleUser: SessionUser = {
    id: 1,
    email: 'admin@sowasuco.vn',
    fullName: 'Phạm Phương Đông',
    role: 'admin',
    unitId: 14,
    unitName: 'Xưởng đồng hồ',
    department: 'Phòng Quản lý Khách hàng',
  };

  it('signs a user into a valid 2-part base64url token', async () => {
    const token = await signSession(sampleUser);
    expect(typeof token).toBe('string');
    const parts = token.split('.');
    expect(parts.length).toBe(2);
    expect(parts[0].length).toBeGreaterThan(10);
    expect(parts[1].length).toBeGreaterThan(10);
  });

  it('verifies a valid token and preserves all user claims and Vietnamese UTF-8 text', async () => {
    const token = await signSession(sampleUser);
    const verified = await verifySession(token);

    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(sampleUser.id);
    expect(verified?.email).toBe(sampleUser.email);
    expect(verified?.fullName).toBe('Phạm Phương Đông');
    expect(verified?.role).toBe('admin');
    expect(verified?.unitId).toBe(14);
    expect(verified?.unitName).toBe('Xưởng đồng hồ');
    expect(verified?.department).toBe('Phòng Quản lý Khách hàng');
    expect(verified?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('strictly rejects tampered payload', async () => {
    const token = await signSession(sampleUser);
    const [payloadB64, signature] = token.split('.');

    // Tamper with payload by changing one character
    const tamperedPayload = payloadB64.slice(0, -2) + (payloadB64.slice(-2) === 'AA' ? 'BB' : 'AA');
    const tamperedToken = `${tamperedPayload}.${signature}`;

    const result = await verifySession(tamperedToken);
    expect(result).toBeNull();
  });

  it('strictly rejects tampered signature', async () => {
    const token = await signSession(sampleUser);
    const [payloadB64, signature] = token.split('.');

    // Tamper with signature
    const tamperedSig = signature.slice(0, -3) + 'xyz';
    const tamperedToken = `${payloadB64}.${tamperedSig}`;

    const result = await verifySession(tamperedToken);
    expect(result).toBeNull();
  });

  it('rejects expired session tokens', async () => {
    // Generate token with negative maxAge (expired in past)
    const expiredToken = await signSession(sampleUser, -10);
    const result = await verifySession(expiredToken);
    expect(result).toBeNull();
  });

  it('gracefully handles malformed or empty tokens', async () => {
    expect(await verifySession('')).toBeNull();
    expect(await verifySession(null)).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession('not.a.valid.jwt.structure')).toBeNull();
    expect(await verifySession('singleparttoken')).toBeNull();
    expect(await verifySession('invalidBase64!@#$.invalidSig!@#$')).toBeNull();
  });
});

describe('Password Hashing & Verification Utility', () => {
  it('hashes plain password using salted SHA-256', () => {
    const hash1 = hashPassword('123456');
    const hash2 = hashPassword('123456');
    expect(hash1).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(hash1).toBe(hash2); // Deterministic salt verification
  });

  it('verifies correct password against modern salted sha256 hash', () => {
    const hash = hashPassword('SecretPassword2026!');
    expect(verifyPassword('SecretPassword2026!', hash)).toBe(true);
    expect(verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('maintains backward compatibility with legacy demo seed placeholder', () => {
    const legacyHash = '$2a$10$SampleHashedPasswordForDemoOnly...';
    expect(verifyPassword('123456', legacyHash)).toBe(true);
    expect(verifyPassword('invalid', legacyHash)).toBe(false);
  });

  it('rejects empty or null passwords and hashes', () => {
    expect(verifyPassword('', 'somehash')).toBe(false);
    expect(verifyPassword('123456', '')).toBe(false);
  });
});
