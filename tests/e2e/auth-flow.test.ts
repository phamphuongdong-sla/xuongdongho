import { describe, it, expect } from 'vitest';
import { loginWithCredentials, quickLogin, switchRole, logout } from '@/actions/auth';
import { verifySession } from '@/lib/session';
import type { UserRole } from '@/types';

describe('E2E Authentication & Session Flow Tests', () => {
  describe('Credential Login with Form Data', () => {
    it('successfully logs in with valid admin credentials (admin@sowasuco.vn / 123456)', async () => {
      const formData = new FormData();
      formData.set('email', 'admin@sowasuco.vn');
      formData.set('password', '123456');

      const result = await loginWithCredentials(formData);
      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe('/');
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('admin@sowasuco.vn');
      expect(result.user?.role).toBe('admin');
      expect(result.user?.fullName).toBe('Phạm Phương Đông');

      // Verify token integrity
      expect(result.token).toBeDefined();
      const verified = await verifySession(result.token!);
      expect(verified).not.toBeNull();
      expect(verified?.id).toBe(result.user?.id);
      expect(verified?.role).toBe('admin');
    });

    it('rejects login with incorrect password', async () => {
      const formData = new FormData();
      formData.set('email', 'admin@sowasuco.vn');
      formData.set('password', 'wrong_password_xyz');

      const result = await loginWithCredentials(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Mật khẩu không chính xác');
    });

    it('rejects login with non-existent user email', async () => {
      const formData = new FormData();
      formData.set('email', 'nonexistent@sowasuco.vn');
      formData.set('password', '123456');

      const result = await loginWithCredentials(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('không tồn tại');
    });

    it('rejects login with missing email or password', async () => {
      const formData = new FormData();
      formData.set('email', '');
      formData.set('password', '');

      const result = await loginWithCredentials(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Vui lòng nhập đầy đủ');
    });

    it('successfully logs in with updated email when admin changes user email', async () => {
      const { prisma } = await import('@/lib/prisma');
      // Temporarily update email for test user
      const originalUser = await prisma.user.findUnique({ where: { email: 'ktv@sowasuco.vn' } });
      if (originalUser) {
        const testEmail = 'ktv.updated@sowasuco.vn';
        await prisma.user.update({
          where: { id: originalUser.id },
          data: { email: testEmail },
        });

        // Try logging in with old email -> should fail
        const oldForm = new FormData();
        oldForm.set('email', 'ktv@sowasuco.vn');
        oldForm.set('password', '123456');
        const oldRes = await loginWithCredentials(oldForm);
        expect(oldRes.success).toBe(false);

        // Try logging in with updated email -> should succeed
        const newForm = new FormData();
        newForm.set('email', testEmail);
        newForm.set('password', '123456');
        const newRes = await loginWithCredentials(newForm);
        expect(newRes.success).toBe(true);
        expect(newRes.user?.email).toBe(testEmail);

        // Revert back
        await prisma.user.update({
          where: { id: originalUser.id },
          data: { email: 'ktv@sowasuco.vn' },
        });
      }
    });
  });

  describe('1-Click Quick Login for All 5 Operational Roles', () => {
    const roles: UserRole[] = ['admin', 'kho', 'ktv', 'accountant', 'unit_user'];

    for (const role of roles) {
      it(`authenticates 1-click quick login for persona: ${role}`, async () => {
        const result = await quickLogin(role);
        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user?.role).toBe(role);
        expect(result.user?.fullName.length).toBeGreaterThan(3);

        // Verify valid HMAC token was issued
        expect(result.token).toBeDefined();
        const verified = await verifySession(result.token!);
        expect(verified).not.toBeNull();
        expect(verified?.role).toBe(role);
      });
    }

    it('verifies Cán bộ Chi nhánh quick login is assigned to branch unit', async () => {
      const result = await quickLogin('unit_user');
      expect(result.success).toBe(true);
      expect(result.user?.role).toBe('unit_user');
      expect(result.user?.fullName).toBe('Lò Văn Nhánh');
      expect(result.user?.unitId).toBeDefined();
      expect(result.user?.unitName?.toLowerCase()).toContain('số 1');
    });
  });

  describe('Quick Role Switcher (R3)', () => {
    it('allows instant role switching between all 5 personas without password re-entry', async () => {
      // 1. Start as admin
      const adminRes = await switchRole('admin');
      expect(adminRes.success).toBe(true);
      expect(adminRes.user?.role).toBe('admin');

      // 2. Switch to Thủ kho
      const khoRes = await switchRole('kho');
      expect(khoRes.success).toBe(true);
      expect(khoRes.user?.role).toBe('kho');
      expect(khoRes.user?.fullName).toBe('Nguyễn Văn Kho');

      // 3. Switch to KTV
      const ktvRes = await switchRole('ktv');
      expect(ktvRes.success).toBe(true);
      expect(ktvRes.user?.role).toBe('ktv');
      expect(ktvRes.user?.fullName).toBe('Trần Kỹ Thuật');

      // 4. Switch to Lãnh đạo / Kế toán
      const accRes = await switchRole('accountant');
      expect(accRes.success).toBe(true);
      expect(accRes.user?.role).toBe('accountant');
      expect(accRes.user?.fullName).toBe('Lê Thị Kế Toán');

      // 5. Switch to Cán bộ Chi nhánh
      const unitRes = await switchRole('unit_user');
      expect(unitRes.success).toBe(true);
      expect(unitRes.user?.role).toBe('unit_user');
      expect(unitRes.user?.fullName).toBe('Lò Văn Nhánh');

      // Verify final session token is valid and unexpired
      const finalVerified = await verifySession(unitRes.token!);
      expect(finalVerified?.role).toBe('unit_user');
      expect(finalVerified?.email).toBe('chinhanh.tp1@sowasuco.vn');
    });
  });

  describe('Logout Mechanism', () => {
    it('executes logout and returns redirect URL to /login', async () => {
      const result = await logout();
      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe('/login');
    });
  });
});
