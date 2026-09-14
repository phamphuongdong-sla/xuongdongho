import { getAggregatedReportsData } from '@/lib/reports-data';
import { ReportsClientView } from './ReportsClientView';
import Link from 'next/link';
import { BarChart3, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const data = await getAggregatedReportsData();

  return (
    <main className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Hệ Thống Báo Cáo &amp; Thống Kê SOWASUCO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Tổng Hợp Kho
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Báo cáo tổng hợp số liệu nhập, xuất và đối soát tồn kho toàn diện: 25 SKU chủng loại đồng hồ nước, 35 SKU vật tư linh kiện sửa chữa và mẫu biểu xuất kho phân bổ từng tháng của Xưởng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/unit-reports"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl border border-slate-200 transition-all"
          >
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>Tổng hợp Nhập Xuất (12 Đơn vị)</span>
          </Link>
          <a
            href="/api/export-excel"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/30 transition-all"
          >
            <span>Tải Báo Cáo Excel (.xlsx)</span>
          </a>
        </div>
      </div>

      <ReportsClientView 
        metersOracle={data.oracle.meters} 
        sparePartsOracle={data.oracle.spare_parts} 
        availableYears={data.availableYears}
        yearlyData={data.yearlyData}
        unitSummaries={data.unitSummaries}
        currentUser={data.user}
        allExportVouchers={data.allExportVouchers as any}
        unitsList={data.units as any}
        employees={data.employees as any}
      />
    </main>
  );
}
