import { getAggregatedReportsData } from '@/lib/reports-data';
import { UnitReportsClientView } from './UnitReportsClientView';
import Link from 'next/link';
import { Building2, BarChart3, FileSpreadsheet } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UnitReportsPage() {
  const data = await getAggregatedReportsData();

  return (
    <main className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Hệ Thống Báo Cáo 12 Đơn Vị Thành Viên</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Tổng hợp Nhập Xuất (12 Đơn vị)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Báo cáo tổng hợp luân chuyển đồng hồ hai chiều giữa Xưởng đồng hồ và 12 đơn vị thành viên: xuất đồng hồ (mới &amp; đã sửa) và nhập kho tiếp nhận đồng hồ cũ về xưởng để sửa chữa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl border border-slate-200 transition-all"
          >
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <span>Tổng hợp kho</span>
          </Link>
          <a
            href="/api/export-excel"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/30 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tải Báo Cáo Excel (.xlsx)</span>
          </a>
        </div>
      </div>

      <UnitReportsClientView
        availableYears={data.availableYears}
        yearlyData={data.yearlyData}
        unitSummaries={data.unitSummaries}
        currentUser={data.user}
        allExportVouchers={data.allExportVouchers as any}
        unitsList={data.units as any}
        initialYearlyPlans={data.unitYearlyPlans}
        initialUsedYearlyPlans={data.unitUsedYearlyPlans}
      />
    </main>
  );
}
