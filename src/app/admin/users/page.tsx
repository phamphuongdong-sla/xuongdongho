import { getUsersManagementData } from '@/actions/users';
import { getCatalogAdminData } from '@/actions/admin-catalog';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UsersClientView } from './UsersClientView';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  let user;
  try {
    user = await requireAuth(['admin', 'kho']);
  } catch {
    redirect('/');
  }

  const [userData, catalogData] = await Promise.all([
    getUsersManagementData(),
    getCatalogAdminData(),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
          {user.role === 'kho' ? 'Phân Hệ Quản Lý Nhân Sự — SOWASUCO WM' : 'Phân Hệ Quản Trị Hệ Thống — SOWASUCO WM'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          {user.role === 'kho' ? 'Danh Mục Nhân Viên Theo Đơn Vị' : 'Quản Trị Hệ Thống, Danh Mục & Người Dùng'}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {user.role === 'kho'
            ? 'Cập nhật danh sách cán bộ, nhân viên phụ trách giao nhận đồng hồ tại 12 đơn vị thành viên & chi nhánh.'
            : 'Quản lý tài khoản người dùng, danh sách nhân viên cán bộ, danh mục 12 đơn vị thành viên & chi nhánh, danh mục 25 SKU đồng hồ nước và 35 SKU vật tư linh kiện sửa chữa.'}
        </p>
      </div>

      <UsersClientView
        initialUsers={userData.users as any}
        units={userData.units as any}
        initialUnits={catalogData.units as any}
        initialMeters={catalogData.meters as any}
        initialSpareParts={catalogData.spareParts as any}
        initialEmployees={catalogData.employees as any}
        currentUser={user}
      />
    </main>
  );
}
