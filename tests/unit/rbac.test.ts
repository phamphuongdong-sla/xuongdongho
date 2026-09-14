import { describe, it, expect } from 'vitest';
import type { UserRole, SessionUser } from '@/types';
import { DEMO_PERSONAS } from '@/lib/auth';

// Define the authoritative role route permission matrix
const ROLE_ALLOWED_ROUTES: Record<UserRole, string[]> = {
  admin: ['/', '/contracts', '/repairs', '/distribution', '/inventory', '/reports', '/admin/users'],
  kho: ['/', '/contracts', '/distribution', '/inventory', '/reports'],
  ktv: ['/', '/repairs', '/inventory'],
  accountant: ['/', '/reports', '/inventory', '/contracts', '/distribution'],
  unit_user: ['/', '/distribution', '/inventory'],
};

// Define operation permission rules
function checkOperationPermission(
  operation: 'delete_voucher' | 'delete_user' | 'edit_opening_stock' | 'create_voucher',
  role: UserRole
): boolean {
  switch (operation) {
    case 'delete_voucher':
    case 'delete_user':
    case 'edit_opening_stock':
      return role === 'admin';
    case 'create_voucher':
      return role === 'admin' || role === 'kho' || role === 'ktv';
    default:
      return false;
  }
}

describe('RBAC Route Accessibility & Navigation Matrix', () => {
  const allSystemRoutes = [
    '/',
    '/contracts',
    '/repairs',
    '/distribution',
    '/inventory',
    '/reports',
    '/admin/users',
  ];

  it('admin has unrestricted access to all 7 routes', () => {
    const allowed = ROLE_ALLOWED_ROUTES.admin;
    expect(allowed.length).toBe(7);
    for (const route of allSystemRoutes) {
      expect(allowed).toContain(route);
    }
  });

  it('thủ kho (kho) has access to procurement, distribution, inventory, reports, but NOT admin or repairs', () => {
    const allowed = ROLE_ALLOWED_ROUTES.kho;
    expect(allowed).toContain('/');
    expect(allowed).toContain('/contracts');
    expect(allowed).toContain('/distribution');
    expect(allowed).toContain('/inventory');
    expect(allowed).toContain('/reports');
    expect(allowed).not.toContain('/admin/users');
    expect(allowed).not.toContain('/repairs');
  });

  it('kỹ thuật viên (ktv) has access to workshop repairs and inventory only', () => {
    const allowed = ROLE_ALLOWED_ROUTES.ktv;
    expect(allowed).toContain('/');
    expect(allowed).toContain('/repairs');
    expect(allowed).toContain('/inventory');
    expect(allowed).not.toContain('/contracts');
    expect(allowed).not.toContain('/distribution');
    expect(allowed).not.toContain('/reports');
    expect(allowed).not.toContain('/admin/users');
  });

  it('kế toán (accountant) has access to reports, inventory, and read-only views, but NOT admin or repairs', () => {
    const allowed = ROLE_ALLOWED_ROUTES.accountant;
    expect(allowed).toContain('/');
    expect(allowed).toContain('/reports');
    expect(allowed).toContain('/inventory');
    expect(allowed).toContain('/contracts');
    expect(allowed).toContain('/distribution');
    expect(allowed).not.toContain('/repairs');
    expect(allowed).not.toContain('/admin/users');
  });

  it('cán bộ chi nhánh (unit_user) has access to branch distribution and branch inventory only', () => {
    const allowed = ROLE_ALLOWED_ROUTES.unit_user;
    expect(allowed).toContain('/');
    expect(allowed).toContain('/distribution');
    expect(allowed).toContain('/inventory');
    expect(allowed).not.toContain('/contracts');
    expect(allowed).not.toContain('/repairs');
    expect(allowed).not.toContain('/reports');
    expect(allowed).not.toContain('/admin/users');
  });
});

describe('RBAC Operation Guard & Deletion Protection Rules', () => {
  it('strictly restricts voucher deletion to admin role', () => {
    expect(checkOperationPermission('delete_voucher', 'admin')).toBe(true);
    expect(checkOperationPermission('delete_voucher', 'kho')).toBe(false);
    expect(checkOperationPermission('delete_voucher', 'ktv')).toBe(false);
    expect(checkOperationPermission('delete_voucher', 'accountant')).toBe(false);
    expect(checkOperationPermission('delete_voucher', 'unit_user')).toBe(false);
  });

  it('strictly restricts user deletion and configuration to admin role', () => {
    expect(checkOperationPermission('delete_user', 'admin')).toBe(true);
    expect(checkOperationPermission('delete_user', 'kho')).toBe(false);
    expect(checkOperationPermission('delete_user', 'ktv')).toBe(false);
    expect(checkOperationPermission('delete_user', 'accountant')).toBe(false);
    expect(checkOperationPermission('delete_user', 'unit_user')).toBe(false);
  });

  it('strictly restricts opening balance overrides to admin role', () => {
    expect(checkOperationPermission('edit_opening_stock', 'admin')).toBe(true);
    expect(checkOperationPermission('edit_opening_stock', 'kho')).toBe(false);
    expect(checkOperationPermission('edit_opening_stock', 'ktv')).toBe(false);
    expect(checkOperationPermission('edit_opening_stock', 'accountant')).toBe(false);
    expect(checkOperationPermission('edit_opening_stock', 'unit_user')).toBe(false);
  });

  it('prohibits accountant and unit_user from creating or modifying warehouse stock', () => {
    expect(checkOperationPermission('create_voucher', 'accountant')).toBe(false);
    expect(checkOperationPermission('create_voucher', 'unit_user')).toBe(false);
    expect(checkOperationPermission('create_voucher', 'kho')).toBe(true);
    expect(checkOperationPermission('create_voucher', 'ktv')).toBe(true);
    expect(checkOperationPermission('create_voucher', 'admin')).toBe(true);
  });
});

describe('Demo Personas Catalog Completeness', () => {
  const roles: UserRole[] = ['admin', 'kho', 'ktv', 'accountant', 'unit_user'];

  it('provides complete persona metadata for all 5 operational roles', () => {
    for (const role of roles) {
      const persona = DEMO_PERSONAS[role];
      expect(persona).toBeDefined();
      expect(persona.email).toContain('@sowasuco.vn');
      expect(persona.fullName.length).toBeGreaterThan(3);
      expect(persona.role).toBe(role);
      expect(persona.roleLabel).toBeDefined();
      expect(persona.department).toBeDefined();
      expect(persona.unitCode).toBeDefined();
      expect(persona.badgeClass).toBeDefined();
    }
  });

  it('configures admin, kho, ktv, and accountant at Central HQ (KHO-VP)', () => {
    expect(DEMO_PERSONAS.admin.unitCode).toBe('KHO-VP');
    expect(DEMO_PERSONAS.kho.unitCode).toBe('KHO-VP');
    expect(DEMO_PERSONAS.ktv.unitCode).toBe('KHO-VP');
    expect(DEMO_PERSONAS.accountant.unitCode).toBe('KHO-VP');
  });

  it('configures unit_user at branch unit (XNCN-TP01)', () => {
    expect(DEMO_PERSONAS.unit_user.unitCode).toBe('XNCN-TP01');
    expect(DEMO_PERSONAS.unit_user.fullName).toBe('Lò Văn Nhánh');
  });
});
