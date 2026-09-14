import { getUsedMetersData } from '@/actions/used-meters';
import { UsedMetersClientView } from './UsedMetersClientView';

export const dynamic = 'force-dynamic';

export default async function UsedMetersPage() {
  const data = await getUsedMetersData();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
            Xưởng Đồng Hồ
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Nhập Kho Đồng Hồ Cũ Từ Đơn Vị (Về Xưởng Sửa Chữa)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tiếp nhận đồng hồ hư hỏng, định kỳ từ 12 chi nhánh/xí nghiệp gửi về xưởng để kiểm tra, sửa chữa và phục hồi quay vòng.
          </p>
        </div>
      </div>

      <UsedMetersClientView
        units={data.units}
        meters={data.meters}
        employees={data.employees}
        vouchers={data.vouchers}
        currentUser={data.currentUser}
      />
    </main>
  );
}
