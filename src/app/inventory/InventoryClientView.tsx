'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Boxes, 
  Search, 
  Filter, 
  Building2, 
  ArrowUpDown,
  Download,
  Gauge,
  Wrench
} from 'lucide-react';

interface Unit {
  id: number;
  code: string;
  name: string;
  type: string;
}

export function InventoryClientView({
  units,
  inventories,
  initialFilters,
}: {
  units: Unit[];
  inventories: any[];
  initialFilters: { unitId?: number; type?: string; status?: string; search?: string };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [unitId, setUnitId] = useState<string>(initialFilters.unitId ? String(initialFilters.unitId) : '');
  const [itemType, setItemType] = useState<string>(initialFilters.type || 'all');
  const [status, setStatus] = useState<string>(initialFilters.status || 'all');
  const [search, setSearch] = useState<string>(initialFilters.search || '');

  const applyFilters = (newUnitId = unitId, newType = itemType, newStatus = status, newSearch = search) => {
    const params = new URLSearchParams();
    if (newUnitId) params.set('unitId', newUnitId);
    if (newType && newType !== 'all') params.set('type', newType);
    if (newStatus && newStatus !== 'all') params.set('status', newStatus);
    if (newSearch) params.set('search', newSearch);

    startTransition(() => {
      router.push(`/inventory?${params.toString()}`);
    });
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    new: { label: 'Mới 100%', color: 'bg-blue-100 text-blue-800' },
    circulating: { label: 'Quay vòng (Đã sửa)', color: 'bg-emerald-100 text-emerald-800' },
    sent_for_repair: { label: 'Chờ sửa chữa', color: 'bg-amber-100 text-amber-800' },
    broken: { label: 'Hỏng / Thanh lý', color: 'bg-slate-100 text-slate-700' },
  };

  const totalQuantity = inventories.reduce((acc, i) => acc + i.quantity, 0);
  const totalValue = inventories.reduce((acc, i) => {
    const price = i.meter ? (i.meter.unitPrice || 0) : (i.sparePart?.unitPrice || 0);
    return acc + i.quantity * price;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" /> Bộ Lọc Tồn Kho
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Unit Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Đơn Vị Quản Lý</label>
            <select
              value={unitId}
              onChange={(e) => {
                setUnitId(e.target.value);
                applyFilters(e.target.value, itemType, status, search);
              }}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">-- Toàn bộ 13 Đơn vị / Xưởng --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phân Loại Hàng</label>
            <select
              value={itemType}
              onChange={(e) => {
                setItemType(e.target.value);
                applyFilters(unitId, e.target.value, status, search);
              }}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">Tất cả (Đồng hồ & Linh kiện)</option>
              <option value="meter">Chỉ Đồng hồ nước</option>
              <option value="spare_part">Chỉ Vật tư linh kiện</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tình Trạng</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                applyFilters(unitId, itemType, e.target.value, search);
              }}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="new">Mới 100%</option>
              <option value="circulating">Quay vòng (Xưởng sửa)</option>
              <option value="sent_for_repair">Chờ sửa chữa</option>
              <option value="broken">Hỏng / Thanh lý</option>
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tìm Kiếm</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  applyFilters(unitId, itemType, status, e.target.value);
                }}
                placeholder="Gõ mã hoặc tên sản phẩm..."
                className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs font-medium">
            Số dòng hiển thị: <strong>{inventories.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-800 shadow-2xs font-medium">
            Tổng số lượng: <strong>{totalQuantity.toLocaleString()} cái</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs font-medium">
            Ước tính giá trị: <strong>{totalValue.toLocaleString()} đ</strong>
          </span>
        </div>

        <a
          href="/api/export-excel"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Xuất Excel Tồn Kho
        </a>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Đơn Vị Quản Lý</th>
                <th className="py-3 px-4">Mã Sản Phẩm</th>
                <th className="py-3 px-4">Tên Sản Phẩm / Linh Kiện</th>
                <th className="py-3 px-4 text-center">Phân Loại</th>
                <th className="py-3 px-4 text-center">Tình Trạng</th>
                <th className="py-3 px-4 text-right">Số Lượng</th>
                <th className="py-3 px-4 text-right">Đơn Giá</th>
                <th className="py-3 px-4 text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    Không tìm thấy dữ liệu phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                inventories.map((inv) => {
                  const isMeter = !!inv.meter;
                  const code = isMeter ? inv.meter.code : inv.sparePart.code;
                  const name = isMeter ? inv.meter.name : inv.sparePart.name;
                  const unitName = isMeter ? inv.meter.unit : inv.sparePart.unit;
                  const price = isMeter ? (inv.meter.unitPrice || 0) : (inv.sparePart?.unitPrice || 0);
                  const st = statusMap[inv.status] || { label: inv.status, color: 'bg-slate-100 text-slate-700' };

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-slate-900">{inv.unit.name}</span>
                        <span className="block text-[10px] text-slate-500 font-mono">{inv.unit.code}</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-brand-700">{code}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{name}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isMeter ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isMeter ? 'Đồng hồ' : 'Linh kiện'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {inv.quantity.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{unitName}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                        {price.toLocaleString()} đ
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {(inv.quantity * price).toLocaleString()} đ
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
