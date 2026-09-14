import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { 
  Gauge, 
  Wrench, 
  Truck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Boxes, 
  Layers,
  Building2,
  ChevronRight,
  PackageCheck,
  Calendar
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [
    totalMetersInv,
    circulatingMetersInv,
    repairWaitingInv,
    totalSparePartsInv,
    recentRepairs,
    recentDispatches,
    alerts,
  ] = await Promise.all([
    prisma.inventory.aggregate({
      where: { meterId: { not: null } },
      _sum: { quantity: true },
    }),
    prisma.inventory.aggregate({
      where: { meterId: { not: null }, status: 'circulating' },
      _sum: { quantity: true },
    }),
    prisma.inventory.aggregate({
      where: { meterId: { not: null }, status: 'sent_for_repair' },
      _sum: { quantity: true },
    }),
    prisma.inventory.aggregate({
      where: { sparePartId: { not: null } },
      _sum: { quantity: true },
    }),
    prisma.repairVoucher.findMany({
      include: { meter: true, sparePartUsages: { include: { sparePart: true } } },
      orderBy: { repairDate: 'desc' },
      take: 6,
    }),
    prisma.exportVoucher.findMany({
      where: { exportReason: { in: ['unit_distribution', 'supplement_repair'] } },
      include: { destinationUnit: true, details: { include: { meter: true } } },
      orderBy: { voucherDate: 'desc' },
      take: 6,
    }),
    prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-200 text-xs font-semibold backdrop-blur-sm border border-brand-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Hệ Thống Trực Tuyến SOWASUCO 2026
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Quản Lý Kho Đồng Hồ Nước & Vật Tư Linh Kiện
          </h1>
          <p className="text-brand-100/80 text-sm sm:text-base leading-relaxed">
            Quy trình chuẩn hóa: Nhập kho linh kiện và đồng hồ mới theo hợp đồng, Xưởng sửa chữa đồng hồ xong nhập vào kho quay vòng (xuất trừ linh kiện), và Xuất cấp đồng hồ cho 12 đơn vị trực thuộc.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/contracts"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-all shadow-md shadow-brand-500/30"
            >
              <FileText className="w-4 h-4" />
              Nhập Kho Theo Hợp Đồng
            </Link>
            <Link
              href="/repairs"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg backdrop-blur-sm transition-all border border-white/10"
            >
              <Wrench className="w-4 h-4" />
              Nhập Kho (ĐH Sửa Chữa)
            </Link>
            <Link
              href="/distribution"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-all shadow-md shadow-emerald-600/30"
            >
              <Truck className="w-4 h-4" />
              Xuất Đồng Hồ (12 Đơn Vị)
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 bg-slate-700/80 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-all border border-slate-600"
            >
              <FileText className="w-4 h-4" />
              Báo Cáo Tổng Hợp
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Meters */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng ĐH Toàn Cty</p>
            <p className="text-3xl font-black text-slate-900">
              {(totalMetersInv._sum.quantity || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">cái</span>
            </p>
            <p className="text-xs text-brand-600 font-medium">Kho VP & 12 đơn vị</p>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

        {/* Circulating Meters (Repaired & Ready) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ĐH Quay Vòng (Đã Sửa)</p>
            <p className="text-3xl font-black text-emerald-600">
              {(circulatingMetersInv._sum.quantity || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">cái</span>
            </p>
            <p className="text-xs text-emerald-700 font-medium">Xưởng sửa xong, sẵn sàng cấp</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Meters Waiting for Repair */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ĐH Chờ Sửa Chữa</p>
            <p className="text-3xl font-black text-amber-600">
              {(repairWaitingInv._sum.quantity || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">cái</span>
            </p>
            <p className="text-xs text-amber-700 font-medium">Tồn tại xưởng chờ bảo dưỡng</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* Total Spare Parts */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linh Kiện Trong Kho</p>
            <p className="text-3xl font-black text-indigo-600">
              {(totalSparePartsInv._sum.quantity || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">cái</span>
            </p>
            <p className="text-xs text-indigo-700 font-medium">35 mã linh kiện Hợp đồng</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Operational Activities Grid (2 Columns: Workshop Repairs & Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Workshop Repairs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Phiếu Sửa Chữa Xưởng Gần Đây
                </h2>
                <p className="text-xs text-slate-500">
                  Nhập kho đồng hồ quay vòng & xuất trừ linh kiện phụ tùng
                </p>
              </div>
            </div>
            <Link
              href="/repairs"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 shrink-0 ml-2"
            >
              Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 divide-y divide-slate-100 flex-1 space-y-3">
            {recentRepairs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có phiếu sửa chữa nào được lập.
              </div>
            ) : (
              recentRepairs.map((r) => (
                <div key={r.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                        {r.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {r.meter.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.repairDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded font-medium">
                      ✓ Đạt chuẩn: <strong className="font-bold">{r.completedQuantity}</strong> cái
                    </span>
                    {r.scrappedQuantity > 0 && (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/60 px-2 py-0.5 rounded font-medium">
                        ✕ Hỏng hủy: <strong className="font-bold">{r.scrappedQuantity}</strong> cái
                      </span>
                    )}
                  </div>

                  {r.sparePartUsages.length > 0 ? (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-medium text-slate-600">Linh kiện đã dùng:</span>{' '}
                      {r.sparePartUsages.map((u, idx) => (
                        <span key={u.id}>
                          {u.sparePart.name} <strong className="text-slate-700 font-semibold">({u.quantity})</strong>
                          {idx < r.sparePartUsages.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      Không sử dụng linh kiện thay thế
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Dispatches to Units */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Phiếu Xuất Đồng Hồ Gần Đây
                </h2>
                <p className="text-xs text-slate-500">
                  Xuất cấp 12 đơn vị trực thuộc & xuất bổ sung xưởng sửa chữa
                </p>
              </div>
            </div>
            <Link
              href="/distribution"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0 ml-2"
            >
              Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 divide-y divide-slate-100 flex-1 space-y-3">
            {recentDispatches.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có phiếu xuất đồng hồ nào được lập.
              </div>
            ) : (
              recentDispatches.map((d) => (
                <div key={d.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        {d.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {d.destinationUnit?.name || 'Xưởng Sửa Chữa'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(d.voucherDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {d.exportReason === 'supplement_repair' ? (
                      <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
                        Xuất bổ sung xưởng sửa
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        Xuất cấp đơn vị
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {d.details.map((dt) => (
                      <div
                        key={dt.id}
                        className="text-[11px] flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100"
                      >
                        <span className="text-slate-700 font-medium">{dt.meter?.name}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              dt.status === 'new'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {dt.status === 'new' ? 'ĐH Mới' : 'ĐH Quay Vòng'}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {dt.quantity} cái
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Alerts & Quick Navigation Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Alerts & Safety Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Cảnh Báo Kho & Linh Kiện
            </h3>
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
              {alerts.length} cảnh báo
            </span>
          </div>

          <div className="space-y-2.5">
            {alerts.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kho vận hành ổn định, không có cảnh báo tồn kho tới ngưỡng.</span>
              </div>
            ) : (
              alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-1"
                >
                  <p className="font-semibold leading-snug">{a.message}</p>
                  <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(a.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Quick Navigation / System Modules */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            Tra Cứu Nhanh & Phân Hệ Vận Hành
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {/* Link to Inventory */}
            <Link
              href="/inventory"
              className="p-3.5 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg group-hover:bg-brand-500 group-hover:text-white transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                    Tồn Kho Chi Tiết 12 Đơn Vị & Kho Xưởng
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Xem tồn ĐH mới, quay vòng, chờ sửa theo từng đơn vị và từng loại đồng hồ
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Link to Reports */}
            <Link
              href="/reports"
              className="p-3.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Báo Cáo Tổng Hợp & Đối Soát Nhập - Xuất - Tồn
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Tổng hợp xuất 12 đơn vị theo tháng/năm, đối soát 25 SKU đồng hồ và 35 SKU vật tư
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Link to Contracts */}
            <Link
              href="/contracts"
              className="p-3.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    Hợp Đồng Mua Sắm & Đợt Giao Hàng
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Theo dõi tiến độ giao hàng và nhập kho linh kiện, đồng hồ mới theo đợt hợp đồng
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
