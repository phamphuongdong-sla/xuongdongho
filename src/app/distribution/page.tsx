import { getDistributionData } from '@/actions/distribution';
import { getSessionUser } from '@/lib/auth';
import { DistributionClientView } from './DistributionClientView';

export const dynamic = 'force-dynamic';

export default async function DistributionPage() {
  const [data, user] = await Promise.all([
    getDistributionData(),
    getSessionUser(),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
          Phân Hệ Điều Phối — 12 Đơn Vị Trực Thuộc
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Xuất Đồng Hồ Cho 12 Đơn Vị
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Lập phiếu xuất cấp đồng hồ từ Xưởng đồng hồ cho các đơn vị cấp nước. Trong một lần xuất có thể xuất nhiều loại đồng hồ (đồng hồ mới hoặc đồng hồ do xưởng sửa), hỗ trợ thêm, sửa, xóa và hoàn tác tồn kho.
        </p>
      </div>

      <DistributionClientView 
        units={data.units as any} 
        meters={data.meters as any} 
        initialVouchers={data.exportVouchers as any} 
        employees={data.employees as any}
        currentUser={user}
      />
    </main>
  );
}

