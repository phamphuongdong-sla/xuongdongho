'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Gauge, 
  Wrench, 
  FileText, 
  Truck, 
  BarChart3, 
  ShieldCheck, 
  Building2, 
  UserCheck,
  RotateCcw,
  LogOut,
  ChevronDown,
  User,
  Check,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { logout, switchRole } from '@/actions/auth';
import type { SessionUser, UserRole } from '@/types';

interface NavigationProps {
  initialUser?: SessionUser | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

const ALL_NAV_ITEMS: Record<string, NavItem> = {
  '/': { href: '/', label: 'Tổng Quan', icon: Gauge },
  '/contracts': { href: '/contracts', label: 'Nhập Kho Theo Hợp Đồng', icon: FileText, badge: 'ĐH mới & LK' },
  '/used-meters': { href: '/used-meters', label: 'Nhập Kho ĐH Cũ', icon: RotateCcw, badge: '12 Đơn vị' },
  '/repairs': { href: '/repairs', label: 'Nhập Kho (ĐH Sửa Chữa)', icon: Wrench, badge: 'Xưởng sửa' },
  '/distribution': { href: '/distribution', label: 'Xuất Đồng Hồ', icon: Truck, badge: '12 Đơn vị' },
  '/unit-reports': { href: '/unit-reports', label: 'Tổng hợp Nhập Xuất (12 Đơn vị)', icon: Building2 },
  '/reports': { href: '/reports', label: 'Tổng hợp kho', icon: BarChart3 },
  '/admin/users': { href: '/admin/users', label: 'Quản Trị Hệ Thống', icon: UserCheck },
};

// Route visibility matrix per role
const ROLE_ALLOWED_ROUTES: Record<UserRole, string[]> = {
  admin: ['/', '/contracts', '/used-meters', '/repairs', '/distribution', '/unit-reports', '/reports', '/admin/users'],
  kho: ['/', '/contracts', '/used-meters', '/repairs', '/distribution', '/unit-reports', '/reports', '/admin/users'],
  ktv: ['/', '/used-meters', '/repairs'],
  accountant: ['/', '/unit-reports', '/reports', '/contracts', '/used-meters', '/distribution'],
  unit_user: ['/', '/used-meters', '/distribution', '/unit-reports'],
};

const ROLE_DISPLAY_CONFIG: Record<
  UserRole,
  { label: string; badgeClass: string; dotClass: string; desc: string }
> = {
  admin: {
    label: 'Quản Trị Viên (Admin)',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-500',
    desc: 'Toàn quyền cấu hình & quản trị',
  },
  kho: {
    label: 'Thủ Kho (Kho VP & Xưởng)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    desc: 'Quản lý kho, nhập HĐ, xuất 12 ĐV',
  },
  ktv: {
    label: 'Kỹ Thuật Viên Xưởng',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    desc: 'Sửa chữa ĐH, trừ tồn linh kiện',
  },
  accountant: {
    label: 'Lãnh Đạo / Kế Toán',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-500',
    desc: 'Xem báo cáo, đối soát số liệu (chỉ đọc)',
  },
  unit_user: {
    label: 'Cán Bộ XNCN Số 1',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    dotClass: 'bg-slate-500',
    desc: 'Xem cấp phát & tồn kho chi nhánh',
  },
};

const SWITCHER_OPTIONS: Array<{ role: UserRole; name: string; email: string }> = [
  { role: 'admin', name: 'Phạm Phương Đông', email: 'admin@sowasuco.vn' },
  { role: 'kho', name: 'Nguyễn Văn Kho', email: 'thukho@sowasuco.vn' },
  { role: 'ktv', name: 'Trần Kỹ Thuật', email: 'ktv@sowasuco.vn' },
  { role: 'accountant', name: 'Lê Thị Kế Toán', email: 'ketoan@sowasuco.vn' },
  { role: 'unit_user', name: 'Lò Văn Nhánh', email: 'chinhanh.tp1@sowasuco.vn' },
];

export function Navigation({ initialUser }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Active user state
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(initialUser || null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If currently on /login page, do not render top navigation
  if (pathname === '/login') {
    return null;
  }

  const effectiveRole: UserRole = currentUser?.role || 'admin';
  const roleConfig = ROLE_DISPLAY_CONFIG[effectiveRole] || ROLE_DISPLAY_CONFIG.admin;

  // Filter allowed routes for current role
  const allowedPaths = ROLE_ALLOWED_ROUTES[effectiveRole] || ROLE_ALLOWED_ROUTES.admin;
  const navItems: NavItem[] = allowedPaths
    .map((path) => {
      const item = ALL_NAV_ITEMS[path];
      if (!item) return null;

      // Custom adjustments for kho, accountant and unit_user
      if (effectiveRole === 'kho' && path === '/admin/users') {
        return { ...item, label: 'Danh Mục Nhân Viên', badge: undefined };
      }
      if (effectiveRole === 'accountant' && (path === '/contracts' || path === '/distribution')) {
        return { ...item, badge: 'Chỉ đọc' };
      }
      if (effectiveRole === 'unit_user') {
        if (path === '/distribution') return { ...item, label: 'Đồng Hồ Đã Nhận', badge: 'Chi nhánh' };
        if (path === '/used-meters') return { ...item, label: 'Gửi ĐH Cũ Đi Sửa', badge: 'Chi nhánh' };
        if (path === '/unit-reports') return { ...item, label: 'Báo Cáo Nhận/Gửi', badge: 'Chi nhánh' };
      }
      return item;
    })
    .filter(Boolean) as NavItem[];

  const handleLogout = async () => {
    startTransition(async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore network errors
      }
      try {
        await logout();
      } catch {
        // Ignore
      }
      router.push('/login');
      router.refresh();
    });
  };

  // Strict Permission: Only Admin (or Admin who has switched role) can switch roles
  const canSwitchRole = currentUser?.role === 'admin' || currentUser?.originalRole === 'admin';

  const handleSwitchRole = async (targetRole: UserRole) => {
    setIsSwitcherOpen(false);
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/switch-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: targetRole }),
        });
        const result = await res.json();
        if (result.success && result.user) {
          setCurrentUser(result.user);
          if (pathname.startsWith('/admin') && targetRole !== 'admin' && targetRole !== 'kho') {
            router.push('/');
          } else {
            router.refresh();
          }
          return;
        }
      } catch {
        // Fallback to server action
      }

      const result = await switchRole(targetRole);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        // If current path is /admin and switching away from admin and kho, navigate to /
        if (pathname.startsWith('/admin') && targetRole !== 'admin' && targetRole !== 'kho') {
          router.push('/');
        } else {
          router.refresh();
        }
      }
    });
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm print:hidden">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white px-4 py-1.5 text-xs flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold tracking-wide text-slate-200">
            Công ty cổ phần cấp nước Sơn La
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            Hệ Thống Quản Lý Kho Đồng Hồ & Vật Tư Sửa Chữa
          </span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Active User Badge */}
          <div className="flex items-center gap-2 text-xs bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${roleConfig.dotClass} animate-pulse`} />
            <span className="font-medium text-white">
              {currentUser?.fullName || 'Phạm Phương Đông'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300 text-[11px]">
              {currentUser?.unitName || 'Kho VP & Xưởng'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${roleConfig.badgeClass}`}>
              {roleConfig.label.split(' ')[0]}
            </span>
          </div>

          {/* Quick Role Switcher (R3) Dropdown in Topbar - ONLY ADMIN */}
          {canSwitchRole && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                disabled={isPending}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-700 hover:bg-brand-600 text-white text-[11px] font-bold tracking-wide transition-all shadow-sm border border-brand-500/40"
                title="Chuyển đổi nhanh vai trò tài khoản (Chỉ dành cho Quản trị viên)"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Chuyển Vai Trò</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSwitcherOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-slate-800 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Bộ Chuyển Đổi Vai Trò (Admin)</span>
                      <span className="text-[10px] text-brand-600 font-semibold">1-Click</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Đặc quyền Quản trị viên kiểm thử giao diện các vai trò
                    </p>
                  </div>

                  <div className="py-1">
                    {SWITCHER_OPTIONS.map((opt) => {
                      const isSelected = effectiveRole === opt.role;
                      const optConfig = ROLE_DISPLAY_CONFIG[opt.role];
                      return (
                        <button
                          key={opt.role}
                          type="button"
                          onClick={() => handleSwitchRole(opt.role)}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-brand-50/70 font-semibold text-brand-900' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${optConfig.dotClass}`} />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">{opt.name}</span>
                                <span className={`text-[9px] px-1 py-0.2 rounded font-medium border ${optConfig.badgeClass}`}>
                                  {opt.role}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500">{optConfig.label}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors text-[11px] font-medium"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <Link href="/" className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                SOWASUCO <span className="text-brand-600 font-extrabold">WM</span>
              </Link>
              <p className="text-[11px] text-slate-500 font-medium">Kho Xưởng & Luân Chuyển Đơn Vị</p>
            </div>
          </div>

          {/* Dynamic Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive 
                        ? 'bg-brand-200 text-brand-800' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Secondary Nav bar for smaller screens */}
      <div className="lg:hidden border-t border-slate-100 px-4 py-2 flex overflow-x-auto gap-2 scrollbar-none bg-slate-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-brand-600 text-white font-semibold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
