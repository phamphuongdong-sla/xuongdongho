import { getRepairsData } from '@/actions/repairs';
import { getSessionUser } from '@/lib/auth';
import { RepairClientView } from './RepairClientView';

export const dynamic = 'force-dynamic';

export default async function RepairsPage({
  searchParams,
}: {
  searchParams?: { meterId?: string };
}) {
  const [data, user] = await Promise.all([
    getRepairsData(),
    getSessionUser(),
  ]);

  const initialMeterId = searchParams?.meterId ? Number(searchParams.meterId) : undefined;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
          Phân Hệ Xưởng — SOWASUCO
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Nhập Kho (ĐH Sửa Chữa) & Xuất Trừ Linh Kiện
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Ghi nhận sửa chữa đồng hồ, tự động xuất trừ kho linh kiện theo định mức hoặc thực tế sử dụng, và nhập đồng hồ hoàn tất vào kho xưởng (kho quay vòng sẵn sàng cấp phát).
        </p>
      </div>

      <RepairClientView 
        meters={data.meters} 
        allMeters={data.allMeters}
        spareParts={data.spareParts} 
        initialVouchers={data.repairVouchers as any} 
        employees={data.employees as any}
        currentUser={user}
        initialMeterId={initialMeterId}
      />
    </main>
  );
}

