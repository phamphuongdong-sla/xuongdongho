'use client';

import React, { useState, useTransition } from 'react';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Search, 
  Printer, 
  Edit, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Calendar, 
  Clock, 
  Package, 
  ArrowDownLeft, 
  Layers, 
  Filter, 
  User, 
  Eye, 
  X,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';
import { 
  createUsedMeterVoucher, 
  updateUsedMeterVoucher, 
  deleteUsedMeterVoucher 
} from '@/actions/used-meters';
import { PrintVoucherModal } from '@/components/vouchers/PrintVoucherModal';
import { ParticipantSelect } from '@/components/vouchers/ParticipantSelect';
import type { SessionUser } from '@/types';

interface UsedMetersClientViewProps {
  units: any[];
  meters: any[];
  employees: any[];
  vouchers: any[];
  currentUser?: SessionUser | null;
}

export function UsedMetersClientView({
  units,
  meters,
  employees,
  vouchers,
  currentUser,
}: UsedMetersClientViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const isKho = currentUser?.role === 'kho' || isAdmin;
  const canEdit = isKho;

  // Filter 12 destination/source units (exclude KHO-VP if preferred, or include)
  const branchUnits = units.filter((u) => u.code !== 'KHO-VP');

  // Available meters for return (excluding ĐH015(SC)-DV, default to ĐH015(SC))
  const availableMeters = meters.filter(
    (m) => m.code !== 'ĐH015(SC)-DV' && !m.name.includes('đơn vị')
  );
  const defaultMeter =
    availableMeters.find((m) => m.code === 'ĐH015(SC)' || m.name.includes('DN15 (sửa chữa)')) ||
    availableMeters[0];

  // Active state for form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any | null>(null);
  const [printData, setPrintData] = useState<any | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');

  // Form inputs
  const [sourceUnitId, setSourceUnitId] = useState<number>(branchUnits[0]?.id || 1);
  const [voucherDate, setVoucherDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [delivererName, setDelivererName] = useState('');
  const [receiverName, setReceiverName] = useState(currentUser?.fullName || 'Nguyễn Văn Kho');
  const [technicianName, setTechnicianName] = useState('Bùi Đức Duy');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ meterId: number; quantity: number; notes: string }>>([
    { meterId: defaultMeter?.id || 1, quantity: 40, notes: 'ĐH cũ cần bảo dưỡng & sửa chữa' },
  ]);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Suggestions for employees
  const unitEmployees = employees.filter((e) => e.unitId === Number(sourceUnitId));
  const khoEmployees = employees.filter(
    (e) => !e.unitId || e.unit?.code === 'KHO-VP' || e.department === 'Xưởng đồng hồ' || e.department?.includes('Kho')
  );

  const handleOpenCreateForm = () => {
    setEditingVoucher(null);
    const initUnitId = branchUnits[0]?.id || 1;
    setSourceUnitId(initUnitId);
    setVoucherDate(new Date().toISOString().split('T')[0]);

    // Load defaults from localStorage
    const savedReceiver = typeof window !== 'undefined' ? localStorage.getItem('wm_default_used_receiver') : null;
    const savedDeliverer = typeof window !== 'undefined' ? localStorage.getItem(`wm_default_used_deliverer_${initUnitId}`) : null;
    const savedTechnician = typeof window !== 'undefined' ? localStorage.getItem('wm_default_used_technician') : null;
    const uEmps = employees.filter((e) => e.unitId === Number(initUnitId));

    setReceiverName(savedReceiver || 'Nguyễn Văn Tiến');
    setDelivererName(savedDeliverer || uEmps[0]?.fullName || '');
    setTechnicianName(savedTechnician || 'Bùi Đức Duy');
    setNotes('');
    setItems([
      { meterId: defaultMeter?.id || 1, quantity: 40, notes: 'ĐH cũ cần bảo dưỡng & sửa chữa' },
    ]);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (v: any) => {
    setEditingVoucher(v);
    const unitId = v.sourceUnitId || branchUnits[0]?.id || 1;
    setSourceUnitId(unitId);
    setVoucherDate(v.voucherDate ? v.voucherDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    const uEmps = employees.filter((e) => e.unitId === Number(unitId));
    const savedDeliverer = typeof window !== 'undefined' ? localStorage.getItem(`wm_default_used_deliverer_${unitId}`) : null;
    setDelivererName(v.delivererName || savedDeliverer || uEmps[0]?.fullName || '');
    const savedReceiver = typeof window !== 'undefined' ? localStorage.getItem('wm_default_used_receiver') : null;
    setReceiverName(v.receiverName || savedReceiver || 'Nguyễn Văn Tiến');
    const savedTechnician = typeof window !== 'undefined' ? localStorage.getItem('wm_default_used_technician') : null;
    setTechnicianName(v.technicianName || savedTechnician || 'Bùi Đức Duy');
    setNotes(v.notes || '');
    setItems(
      v.items && v.items.length > 0
        ? v.items.map((i: any) => ({
            meterId: i.meterId,
            quantity: i.quantity,
            notes: i.notes || '',
          }))
        : [{ meterId: defaultMeter?.id || 1, quantity: 40, notes: 'ĐH cũ cần bảo dưỡng & sửa chữa' }]
    );
    setIsFormOpen(true);
  };

  const handleAddItemRow = () => {
    setItems([...items, { meterId: defaultMeter?.id || 1, quantity: 40, notes: 'ĐH cũ cần bảo dưỡng & sửa chữa' }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (typeof window !== 'undefined') {
      if (delivererName) localStorage.setItem(`wm_default_used_deliverer_${sourceUnitId}`, delivererName);
      if (receiverName) localStorage.setItem('wm_default_used_receiver', receiverName);
      if (technicianName) localStorage.setItem('wm_default_used_technician', technicianName);
    }

    startTransition(async () => {
      try {
        if (editingVoucher) {
          const res = await updateUsedMeterVoucher(editingVoucher.id, {
            sourceUnitId: Number(sourceUnitId),
            voucherDate,
            delivererName,
            receiverName,
            technicianName,
            notes,
            items: items.map((i) => ({
              meterId: Number(i.meterId),
              quantity: Number(i.quantity),
              notes: i.notes,
            })),
          });
          if (res.success) {
            setMessage({ type: 'success', text: 'Cập nhật phiếu nhập kho đồng hồ cũ thành công!' });
            setIsFormOpen(false);
          }
        } else {
          const res = await createUsedMeterVoucher({
            sourceUnitId: Number(sourceUnitId),
            voucherDate,
            delivererName,
            receiverName,
            technicianName,
            notes,
            items: items.map((i) => ({
              meterId: Number(i.meterId),
              quantity: Number(i.quantity),
              notes: i.notes,
            })),
          });
          if (res.success) {
            setMessage({
              type: 'success',
              text: `Tạo phiếu ${res.voucher.code} nhập kho đồng hồ cũ thành công! Tồn chờ sửa xưởng đã tăng.`,
            });
            setIsFormOpen(false);
          }
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Lỗi xử lý phiếu nhập kho đồng hồ cũ' });
      }
    });
  };

  const handleDelete = async (voucherId: number, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phiếu ${code}? Tồn kho chờ sửa sẽ được hoàn nguyên.`)) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await deleteUsedMeterVoucher(voucherId);
        if (res.success) {
          setMessage({ type: 'success', text: `Đã xóa phiếu ${code} và hoàn nguyên tồn kho!` });
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Lỗi khi xóa phiếu' });
      }
    });
  };

  const handlePrint = (v: any) => {
    setPrintData({
      type: 'import',
      code: v.code,
      voucherDate: v.voucherDate,
      delivererName: v.delivererName || delivererName,
      receiverName: v.receiverName || receiverName || 'Nguyễn Văn Tiến',
      destinationOrSupplier: v.sourceUnitName || 'Đơn vị chuyển về',
      warehouseName: 'Xưởng đồng hồ',
      reason: 'Nhập kho đồng hồ cũ gửi về xưởng để kiểm tra, sửa chữa và quay vòng',
      notes: v.notes,
      creatorName: v.receiverName || receiverName || 'Nguyễn Văn Tiến',
      technicianName: v.technicianName || technicianName || 'Bùi Đức Duy',
      voucherCategory: 'used_meter_import',
      items: v.items.map((i: any, idx: number) => ({
        stt: idx + 1,
        code: i.meterCode,
        name: i.meterName,
        unit: i.meterUnit || 'Cái',
        actualQuantity: i.quantity,
        statusText: 'Chờ sửa chữa',
        notes: i.notes,
      })),
    });
  };

  // Filter vouchers
  const filteredVouchers = vouchers.filter((v) => {
    const matchSearch =
      v.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.sourceUnitName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.delivererName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.receiverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.items?.some((i: any) => i.meterName?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchUnit = unitFilter === 'all' || String(v.sourceUnitId) === unitFilter;

    return matchSearch && matchUnit;
  });

  // Calculate statistics
  const totalImportedMeters = vouchers.reduce((sum, v) => sum + (v.totalQuantity || 0), 0);
  const totalWaitingRepairStock = meters.reduce((sum, m) => sum + (m.waitingStock || 0), 0);
  const distinctUnitsCount = new Set(vouchers.map((v) => v.sourceUnitId)).size;

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tổng Phiếu Đã Nhập</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{vouchers.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Phiếu tiếp nhận ĐH cũ</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tổng ĐH Cũ Nhận Về</p>
            <p className="text-2xl font-black text-brand-700 mt-1">{totalImportedMeters.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Cái (từ 12 đơn vị gửi về)</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase">Tồn Chờ Sửa Xưởng</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{totalWaitingRepairStock.toLocaleString()}</p>
            <p className="text-[11px] text-amber-600 mt-0.5">Sẵn sàng đưa vào sửa chữa</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Đơn Vị Đã Chuyển Về</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{distinctUnitsCount} / 12</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Chi nhánh & xí nghiệp</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Notification Message */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button type="button" onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xs">✕</button>
        </div>
      )}

      {/* Main Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search box */}
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm số phiếu, đơn vị, người giao..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          {/* Unit filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Tất cả 12 đơn vị</option>
              {branchUnits.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Phiếu Nhập Kho ĐH Cũ</span>
          </button>
        )}
      </div>

      {/* Modal / Form: Create / Edit Used Meter Voucher */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold">
                    {editingVoucher ? `Chỉnh Sửa Phiếu Nhập: ${editingVoucher.code}` : 'Lập Phiếu Nhập Kho Đồng Hồ Cũ Từ Đơn Vị'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingVoucher ? 'Cập nhật lại số lượng và chủng loại đồng hồ tiếp nhận' : 'Ghi nhận đồng hồ cũ chuyển về xưởng, tăng tồn chờ sửa'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đơn Vị Chuyển Về <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sourceUnitId}
                    onChange={(e) => {
                      const newId = Number(e.target.value);
                      setSourceUnitId(newId);
                      const saved = typeof window !== 'undefined' ? localStorage.getItem(`wm_default_used_deliverer_${newId}`) : null;
                      const uEmps = employees.filter((emp) => emp.unitId === newId);
                      setDelivererName(saved || uEmps[0]?.fullName || '');
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  >
                    {branchUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày Nhập Kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={voucherDate}
                    onChange={(e) => setVoucherDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ParticipantSelect
                  label="Người Giao Hàng (Cán bộ đơn vị)"
                  value={delivererName}
                  onChange={setDelivererName}
                  options={unitEmployees.length > 0 ? unitEmployees : employees}
                  defaultKey={`wm_default_used_deliverer_${sourceUnitId}`}
                  defaultFallback={unitEmployees[0]?.fullName || ''}
                  placeholder="Chọn cán bộ giao hàng"
                  helpText={`Bên cử bàn giao: ${branchUnits.find(u => u.id === Number(sourceUnitId))?.name || 'Chi nhánh'}`}
                />

                <ParticipantSelect
                  label="Người Nhận Hàng (Thủ kho xưởng)"
                  value={receiverName}
                  onChange={setReceiverName}
                  options={khoEmployees.length > 0 ? khoEmployees : employees}
                  defaultKey="wm_default_used_receiver"
                  defaultFallback="Nguyễn Văn Tiến"
                  placeholder="Chọn cán bộ nhận kho xưởng"
                  helpText="Xưởng đồng hồ tiếp nhận phân loại và lưu kho"
                />

                <ParticipantSelect
                  label="Phụ Trách Kỹ Thuật (Xưởng đồng hồ)"
                  value={technicianName}
                  onChange={setTechnicianName}
                  options={khoEmployees.length > 0 ? khoEmployees : employees}
                  defaultKey="wm_default_used_technician"
                  defaultFallback="Bùi Đức Duy"
                  placeholder="Chọn phụ trách kỹ thuật"
                  helpText="Cán bộ kỹ thuật kiểm tra và phân loại đồng hồ"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Phiếu</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: ĐH cũ tháo dỡ định kỳ đợt 1 chuyển về xưởng sửa chữa..."
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Items Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-brand-600" />
                    <span>Danh Sách Đồng Hồ Cũ Nhận Về</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Dòng</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60"
                    >
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Loại Đồng Hồ <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.meterId}
                          onChange={(e) => handleItemChange(idx, 'meterId', Number(e.target.value))}
                          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          {availableMeters.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Số Lượng <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-right font-bold text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          required
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Tình Trạng / Ghi Chú
                        </label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                          placeholder="Hỏng kẹt bánh răng, mặt số mờ..."
                          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="mt-3 p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center px-3 py-2 bg-brand-50/60 rounded-xl border border-brand-100 text-xs font-bold text-brand-900">
                  <span>Tổng Số Lượng Tiếp Nhận:</span>
                  <span className="text-sm text-brand-700">
                    {items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)} Cái
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-2"
                >
                  {isPending ? (
                    <span>Đang Lưu...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingVoucher ? 'Cập Nhật Phiếu' : 'Lưu & Nhập Kho Chờ Sửa'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Table (Tra Cứu Lịch Sử) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              Lịch Sử Phiếu Nhập Kho Đồng Hồ Cũ (Tra Cứu & In Phiếu)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hiển thị {filteredVouchers.length} phiếu tiếp nhận từ các đơn vị về xưởng
            </p>
          </div>
        </div>

        {filteredVouchers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            Chưa có phiếu nhập kho đồng hồ cũ nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Số Phiếu</th>
                  <th className="py-3 px-3">Ngày Lập</th>
                  <th className="py-3 px-4">Đơn Vị Chuyển Về</th>
                  <th className="py-3 px-3">Người Giao</th>
                  <th className="py-3 px-3">Người Nhận</th>
                  <th className="py-3 px-4">Chủng Loại & Số Lượng</th>
                  <th className="py-3 px-3 text-right">Tổng SL</th>
                  <th className="py-3 px-4">Ghi Chú</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-brand-700 whitespace-nowrap">
                      {v.code}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {new Date(v.voucherDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        {v.sourceUnitName}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {v.delivererName || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <p className="font-semibold text-slate-800">{v.receiverName || '-'}</p>
                      <p className="text-[10px] text-slate-400">KT: {v.technicianName || 'Bùi Đức Duy'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {v.items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-1.5 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                            <span className="font-bold text-slate-800">{item.meterName}:</span>
                            <span className="font-extrabold text-brand-700">{item.quantity}</span>
                            <span className="text-slate-400">cái</span>
                            {item.notes && <span className="text-slate-400 italic text-[10px]">({item.notes})</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-sm text-slate-900 whitespace-nowrap">
                      {v.totalQuantity}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {v.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Print Button */}
                        <button
                          type="button"
                          onClick={() => handlePrint(v)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-brand-600 transition-colors"
                          title="In phiếu nhập kho ĐH cũ"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(v)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition-colors"
                            title="Chỉnh sửa phiếu"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(v.id, v.code)}
                            disabled={isPending}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Xóa phiếu (hoàn nguyên tồn kho)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Voucher Modal */}
      {printData && (
        <PrintVoucherModal
          data={printData}
          onClose={() => setPrintData(null)}
        />
      )}
    </div>
  );
}
