import { getContractsData } from '@/actions/contracts';
import { getSessionUser } from '@/lib/auth';
import { ContractsClientView } from './ContractsClientView';

export const dynamic = 'force-dynamic';

export default async function ContractsPage() {
  const [data, user] = await Promise.all([
    getContractsData(),
    getSessionUser(),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
          Phân Hệ Nhập Kho — SOWASUCO
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Nhập Kho Theo Hợp Đồng (Linh Kiện & Đồng Hồ Mới)
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Quản lý các hợp đồng mua sắm theo nhiều đợt trong năm, lập phiếu nhập kho linh kiện và đồng hồ mới (hỗ trợ nạp nhanh từ mẫu Excel), đầy đủ chức năng thêm, sửa, xóa.
        </p>
      </div>

      <ContractsClientView 
        contracts={data.contracts as any} 
        meters={data.meters as any}
        spareParts={data.spareParts as any} 
        initialImports={data.importVouchers as any} 
        employees={data.employees as any}
        currentUser={user}
      />
    </main>
  );
}

