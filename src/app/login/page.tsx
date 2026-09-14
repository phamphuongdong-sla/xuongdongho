'use client';

import { useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Droplets,
  Lock, 
  Mail, 
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { loginWithCredentials } from '@/actions/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCredentialsLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set('email', email);
    formData.set('password', password);

    startTransition(async () => {
      const result = await loginWithCredentials(formData);
      if (result.success) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(result.error || 'Đăng nhập không thành công');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-500 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-sky-500 blur-3xl" />
      </div>

      {/* Brand Header */}
      <div className="relative max-w-4xl mx-auto w-full text-center space-y-3">
        <div className="inline-flex items-center justify-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold tracking-wide text-brand-200">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span>CỔNG ĐĂNG NHẬP NỘI BỘ</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Công ty cổ phần cấp nước Sơn La
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-medium max-w-2xl mx-auto">
          Phân Hệ Quản Lý Kho Đồng Hồ, Linh Kiện Sửa Chữa & Luân Chuyển 12 Chi Nhánh (SOWASUCO WM)
        </p>
      </div>

      {/* Main Container */}
      <div className="relative max-w-md mx-auto w-full my-8">
        <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-600" />
              Đăng Nhập Tài Khoản
            </h2>
            <p className="text-xs text-slate-500">
              Nhập email và mật khẩu công vụ được cấp bởi SOWASUCO
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Công Vụ
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sowasuco.vn"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mật Khẩu
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Xác Nhận Đăng Nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Phiên bản: SOWASUCO WM v1.0</span>
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Hệ thống sẵn sàng
            </span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="relative text-center text-xs text-slate-500 py-3 border-t border-slate-800">
        © 2026 Công ty cổ phần cấp nước Sơn La. Hệ thống bảo mật nội bộ.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span>Đang tải cổng đăng nhập SOWASUCO...</span>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
