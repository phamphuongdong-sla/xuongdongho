import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'SOWASUCO WM - Quản lý Kho Đồng hồ & Vật tư Linh kiện',
  description: 'Hệ thống Quản lý Kho Đồng hồ nước, Xưởng sửa chữa & Luân chuyển 12 Đơn vị - SOWASUCO',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 antialiased font-sans text-slate-900 flex flex-col">
        <Navigation initialUser={user} />
        <div className="flex-1">
          {children}
        </div>
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 print:hidden">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© 2026 Công ty cổ phần cấp nước Sơn La. All rights reserved.</span>
            <span>Phiên bản Webapp v1.0 — Quản lý Kho Đồng Hồ & Vật Tư Sửa Chữa tác giả phạm phương đông</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
