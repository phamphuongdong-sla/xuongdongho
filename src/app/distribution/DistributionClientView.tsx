'use client';

import { useState, useEffect } from 'react';
import { 
  dispatchMultipleMetersToUnit, 
  deleteExportVoucher, 
  updateExportVoucher,
  updateExportVoucherNotes 
} from '@/actions/distribution';
import { 
  Truck, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Boxes,
  Printer
} from 'lucide-react';
import { PrintVoucherModal, VoucherPrintData } from '@/components/vouchers/PrintVoucherModal';
import { ParticipantSelect } from '@/components/vouchers/ParticipantSelect';
import { MeterNoteCombobox } from '@/components/vouchers/MeterNoteCombobox';
import type { SessionUser } from '@/types';

interface Unit {
  id: number;
  code: string;
  name: string;
  displayName: string;
  type: string;
}

interface MeterWithStock {
  id: number;
  code: string;
  name: string;
  category: string;
  newStock: number;
  circulatingStock: number;
}

interface ExportItemRow {
  meterId: number;
  meterStatus: 'new' | 'circulating';
  quantity: number;
  notes?: string;
}

export function DistributionClientView({
  units,
  meters,
  initialVouchers,
  employees = [],
  currentUser,
}: {
  units: Unit[];
  meters: MeterWithStock[];
  initialVouchers: any[];
  employees?: any[];
  currentUser?: SessionUser | null;
}) {
  const isAdmin = currentUser ? (currentUser.role === 'admin' || currentUser.originalRole === 'admin') : true;
  const canDispatch = currentUser ? (currentUser.role === 'admin' || currentUser.role === 'kho' || currentUser.originalRole === 'admin') : true;
  const canDelete = canDispatch;

  const [selectedUnitId, setSelectedUnitId] = useState<number>(units[0]?.id || 1);
  const [creatorName, setCreatorName] = useState<string>('Nguyễn Văn Tiến');
  const [delivererName, setDelivererName] = useState<string>('');
  const [technicianName, setTechnicianName] = useState<string>('Bùi Đức Duy');

  const khoEmployees = employees.filter(
    (e) => !e.unitId || e.unit?.code === 'KHO-VP' || e.department === 'Xưởng đồng hồ' || e.department?.includes('Kho')
  );
  const unitEmployees = employees.filter((e) => e.unitId === selectedUnitId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCreator = localStorage.getItem('wm_default_dist_creator');
      if (savedCreator) setCreatorName(savedCreator);

      const savedTechnician = localStorage.getItem('wm_default_dist_technician');
      if (savedTechnician) setTechnicianName(savedTechnician);

      const savedDeliverer = localStorage.getItem(`wm_default_dist_deliverer_${selectedUnitId}`);
      if (savedDeliverer) {
        setDelivererName(savedDeliverer);
      } else {
        const uEmps = employees.filter((e) => e.unitId === selectedUnitId);
        setDelivererName(uEmps[0]?.fullName || '');
      }
    }
  }, [selectedUnitId]);

  const [items, setItems] = useState<ExportItemRow[]>([
    { meterId: meters[0]?.id || 1, meterStatus: 'circulating', quantity: 15 },
    { meterId: meters.find(m => m.code === 'ĐH025')?.id || meters[1]?.id || 2, meterStatus: 'new', quantity: 5 },
  ]);
  const [notes, setNotes] = useState<string>('Xuất cấp đồng hồ phục vụ bảo dưỡng và thay mới định kỳ');

  // Edit notes state
  const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');

  // Full voucher edit modal state
  const [editingExportVoucher, setEditingExportVoucher] = useState<any | null>(null);
  const [editDestUnitId, setEditDestUnitId] = useState<number>(units[0]?.id || 1);
  const [editVoucherDate, setEditVoucherDate] = useState<string>('');
  const [editCreator, setEditCreator] = useState<string>('Nguyễn Văn Tiến');
  const [editDeliverer, setEditDeliverer] = useState<string>('');
  const [editTechnician, setEditTechnician] = useState<string>('Bùi Đức Duy');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editItems, setEditItems] = useState<ExportItemRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [printModalData, setPrintModalData] = useState<VoucherPrintData | null>(null);

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || units[0];

  const handleAddRow = () => {
    const nextMeter = meters.find(m => !items.some(i => i.meterId === m.id)) || meters[0];
    setItems([
      ...items,
      { meterId: nextMeter.id, meterStatus: 'circulating', quantity: 10 }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ExportItemRow, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'meterStatus') {
      if (value === 'new_to_repair') {
        if (!updated[index].notes) {
          updated[index].notes = 'Xuất bổ sung ĐH mới sang ĐH sửa chữa do thay đổi kế hoạch';
        }
      }
    }
    setItems(updated);
  };

  // Check if any row exceeds available stock
  const hasDeficit = items.some((item) => {
    const m = meters.find(meter => meter.id === item.meterId);
    if (!m) return false;
    const available = item.meterStatus === 'new' ? m.newStock : m.circulatingStock;
    return item.quantity > available;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Vui lòng thêm ít nhất một mặt hàng đồng hồ để xuất.' });
      return;
    }

    if (hasDeficit) {
      setMessage({ type: 'error', text: 'Có loại đồng hồ vượt quá số lượng tồn kho khả dụng tại Kho VP!' });
      return;
    }

    setLoading(true);
    try {
      const res = await dispatchMultipleMetersToUnit({
        destinationUnitId: selectedUnitId,
        items: items.filter(i => i.quantity > 0),
        delivererName,
        receiverName: creatorName,
        notes,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('wm_default_dist_creator', creatorName);
        localStorage.setItem(`wm_default_dist_deliverer_${selectedUnitId}`, delivererName);
        localStorage.setItem('wm_default_dist_technician', technicianName);
      }

      const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
      setMessage({
        type: 'success',
        text: `Đã lập phiếu xin lĩnh thành công (${res.code})! Đã cấp ${totalQty} đồng hồ (${items.length} chủng loại) cho đơn vị: ${selectedUnit.displayName}.`,
      });
      // Reset
      setItems([{ meterId: meters[0]?.id || 1, meterStatus: 'circulating', quantity: 10 }]);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi lập phiếu xuất kho' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = async (id: number, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa phiếu xuất ${code}? Toàn bộ số lượng đồng hồ sẽ được hoàn trả về Kho VP và trừ ở đơn vị nhận.`)) return;
    setLoading(true);
    try {
      await deleteExportVoucher(id);
      setMessage({ type: 'success', text: `Đã xóa phiếu xuất ${code} và hoàn tác tồn kho thành công!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async (id: number) => {
    setLoading(true);
    try {
      await updateExportVoucherNotes(id, editingNotes);
      setMessage({ type: 'success', text: 'Đã cập nhật ghi chú phiếu xuất thành công!' });
      setEditingVoucherId(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditExport = (v: any) => {
    setEditingExportVoucher(v);
    const destId = v.destinationUnitId || units[0]?.id || 1;
    setEditDestUnitId(destId);
    setEditVoucherDate(v.voucherDate ? new Date(v.voucherDate).toISOString().split('T')[0] : '');
    const savedCreator = typeof window !== 'undefined' ? localStorage.getItem('wm_default_dist_creator') : null;
    const savedTechnician = typeof window !== 'undefined' ? localStorage.getItem('wm_default_dist_technician') : null;
    const savedDeliverer = typeof window !== 'undefined' ? localStorage.getItem(`wm_default_dist_deliverer_${destId}`) : null;
    const uEmps = employees.filter((e) => e.unitId === destId);
    setEditCreator(v.receiverName || savedCreator || 'Nguyễn Văn Tiến');
    setEditDeliverer(v.delivererName || savedDeliverer || uEmps[0]?.fullName || '');
    setEditTechnician(savedTechnician || 'Bùi Đức Duy');
    setEditNotes(v.notes || '');
    if (v.details && v.details.length > 0) {
      setEditItems(v.details.map((d: any) => ({
        meterId: d.meterId,
        meterStatus: d.status || 'new',
        quantity: d.quantity,
        notes: d.notes || '',
      })));
    } else {
      setEditItems([{ meterId: meters[0]?.id || 1, meterStatus: 'circulating', quantity: 10 }]);
    }
  };

  const handleSaveEditExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExportVoucher) return;
    setLoading(true);
    try {
      await updateExportVoucher(editingExportVoucher.id, {
        destinationUnitId: editDestUnitId,
        voucherDate: editVoucherDate || undefined,
        delivererName: editDeliverer,
        receiverName: editCreator,
        notes: editNotes,
        items: editItems.filter(i => i.quantity > 0),
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('wm_default_dist_creator', editCreator);
        localStorage.setItem(`wm_default_dist_deliverer_${editDestUnitId}`, editDeliverer);
        localStorage.setItem('wm_default_dist_technician', editTechnician);
      }
      setMessage({ type: 'success', text: `Đã cập nhật thành công phiếu ${editingExportVoucher.code} và điều chỉnh tồn kho!` });
      setEditingExportVoucher(null);
      window.location.reload();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi cập nhật phiếu xuất' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-600" />
                Lập Phiếu Xin Lĩnh Đồng Hồ Cho Đơn Vị
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Một lần xuất có thể xuất cùng lúc nhiều loại đồng hồ mới và đồng hồ xưởng sửa
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-brand-50 text-brand-700">
              Phiếu Xin Lĩnh (12 ĐV)
            </span>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg text-sm flex items-center justify-between gap-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
              <button type="button" onClick={() => setMessage(null)} className="text-xs font-bold text-slate-400 hover:text-slate-700">✕</button>
            </div>
          )}

          {/* 1. Select Unit (Clean concise name) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Đơn Vị Tiếp Nhận <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => {
                const newId = Number(e.target.value);
                setSelectedUnitId(newId);
                const saved = typeof window !== 'undefined' ? localStorage.getItem(`wm_default_dist_deliverer_${newId}`) : null;
                const uEmps = employees.filter((emp) => emp.unitId === newId);
                setDelivererName(saved || uEmps[0]?.fullName || '');
              }}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName || u.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Địa bàn bàn giao: <span className="font-semibold text-slate-700">{selectedUnit.displayName || selectedUnit.name}</span>
            </p>
          </div>

          {/* Cán bộ tham gia ký phiếu xin lĩnh */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <ParticipantSelect
              label="Người Lập Phiếu"
              value={creatorName}
              onChange={setCreatorName}
              options={khoEmployees.length > 0 ? khoEmployees : employees}
              defaultKey="wm_default_dist_creator"
              defaultFallback="Nguyễn Văn Tiến"
              placeholder="Chọn người lập phiếu"
              helpText="Người lập phiếu xin lĩnh"
              required
            />

            <ParticipantSelect
              label="Người Giao (Cán bộ theo đơn vị)"
              value={delivererName}
              onChange={setDelivererName}
              options={unitEmployees.length > 0 ? unitEmployees : employees}
              defaultKey={`wm_default_dist_deliverer_${selectedUnitId}`}
              defaultFallback={unitEmployees[0]?.fullName || `Đại diện ${selectedUnit.displayName}`}
              placeholder="Chọn cán bộ theo đơn vị"
              helpText={`Bên đơn vị: ${selectedUnit.displayName}`}
              required
            />

            <ParticipantSelect
              label="Phụ Trách Kỹ Thuật"
              value={technicianName}
              onChange={setTechnicianName}
              options={khoEmployees.length > 0 ? khoEmployees : employees}
              defaultKey="wm_default_dist_technician"
              defaultFallback="Bùi Đức Duy"
              placeholder="Chọn phụ trách kỹ thuật"
              helpText="Phụ trách kỹ thuật xưởng đồng hồ"
              required
            />
          </div>

          {/* 2. Multiple Meter Rows */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Danh Sách Đồng Hồ Xuất Cấp ({items.length} loại)
                </label>
                <p className="text-[11px] text-slate-500">
                  Mỗi loại có thể chọn xuất đồng hồ mới 100% hoặc đồng hồ xưởng sửa (quay vòng)
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200/60 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Loại Đồng Hồ
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {items.map((row, idx) => {
                const m = meters.find(meter => meter.id === row.meterId);
                const available = m ? (row.meterStatus === 'new' ? m.newStock : m.circulatingStock) : 0;
                const isOver = row.quantity > available;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs space-y-2 transition-colors ${
                      isOver ? 'bg-red-50/60 border-red-200' : 'bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div className="flex gap-2 items-center">
                      {/* Meter select */}
                      <div className="flex-1">
                        <select
                          value={row.meterId}
                          onChange={(e) => handleItemChange(idx, 'meterId', Number(e.target.value))}
                          className="w-full text-xs border rounded-lg p-2 bg-white font-medium focus:outline-none"
                        >
                          {meters.map((meter) => (
                            <option key={meter.id} value={meter.id}>
                              {meter.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status select */}
                      <div className="w-52">
                        <select
                          value={row.meterStatus}
                          onChange={(e) => handleItemChange(idx, 'meterStatus', e.target.value as any)}
                          className={`w-full text-xs border rounded-lg p-2 font-semibold focus:outline-none ${
                            row.meterStatus === 'new'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <option value="circulating">ĐH Xưởng Sửa (Quay vòng)</option>
                          <option value="new">ĐH Mới 100%</option>
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="w-24">
                        <input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          placeholder="Số lượng"
                          className="w-full text-xs border rounded-lg p-2 text-right font-bold focus:outline-none"
                          required
                        />
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={items.length === 1}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Ghi chú dòng */}
                    <div className="px-0.5">
                      <MeterNoteCombobox
                        value={row.notes || ''}
                        onChange={(val) => handleItemChange(idx, 'notes', val)}
                        placeholder="Ghi chú / Mục đích xuất (chọn nhanh hoặc tự nhập)..."
                        className="w-full"
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] px-1">
                      <span className="text-slate-500">
                        Tồn khả dụng tại Kho VP ({row.meterStatus === 'new' ? 'Mới 100%' : 'Xưởng sửa'}):
                      </span>
                      <span className={`font-mono font-bold ${isOver ? 'text-red-600' : 'text-slate-700'}`}>
                        {available} cái {isOver && '— Không đủ tồn kho!'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú Phiếu Xuất</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Cấp phát theo kế hoạch thay thế tháng 3/2026..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-slate-600">
              Tổng số lượng xuất: <strong className="text-slate-900 text-sm">{items.reduce((acc, i) => acc + i.quantity, 0)} cái</strong> ({items.length} loại)
            </div>

            {canDispatch ? (
              <button
                type="submit"
                disabled={loading || hasDeficit || items.length === 0}
                className="py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Đang Lưu Phiếu Xuất...' : 'Lưu Tạo Phiếu Xuất Kho'}
              </button>
            ) : (
              <div className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs border border-slate-200">
                Chế độ chỉ xem phiếu (Chỉ đọc)
              </div>
            )}
          </div>

        </form>
      </div>

      {/* History Section (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-600" />
              Lịch Sử Phiếu Xuất Đồng Hồ
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {initialVouchers.length} phiếu đã tạo
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {initialVouchers.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">Chưa có phiếu xuất nào.</p>
            ) : (
              initialVouchers.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white text-xs space-y-2 transition-colors shadow-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        {v.code}
                      </span>
                      <span className="ml-2 font-bold text-slate-900">
                        ➔ {v.destinationUnit?.name || 'Đơn vị tiếp nhận'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 mr-1">
                        {new Date(v.voucherDate).toLocaleDateString('vi-VN')}
                      </span>
                      <button
                        onClick={() => {
                          setPrintModalData({
                            type: 'export',
                            voucherCategory: 'unit_distribution_export',
                            customTitle: 'PHIẾU XIN LĨNH',
                            code: v.code,
                            voucherDate: v.voucherDate,
                            destinationOrSupplier: v.destinationUnit?.name || 'Chi nhánh Cấp nước',
                            warehouseName: 'Xưởng đồng hồ',
                            delivererName: v.delivererName || delivererName || 'Đại diện đơn vị',
                            receiverName: v.receiverName || creatorName || 'Nguyễn Văn Tiến',
                            creatorName: creatorName || 'Nguyễn Văn Tiến',
                            technicianName: technicianName || 'Bùi Đức Duy',
                            reason: v.notes || 'Xuất cấp đồng hồ phục vụ mạng lưới cấp nước',
                            items: (v.details || []).map((d: any, idx: number) => ({
                              stt: idx + 1,
                              code: d.meter?.code || `ĐH-${d.meterId}`,
                              name: d.meter?.name || 'Đồng hồ nước',
                              unit: d.meter?.unit || 'Cái',
                              actualQuantity: d.quantity,
                              unitPrice: d.unitPrice || 0,
                              amount: d.lineAmount || (d.quantity * (d.unitPrice || 0)),
                              statusText: d.status === 'new' ? 'Mới 100%' : 'Quay vòng (Xưởng sửa)',
                              notes: d.notes,
                            })),
                            notes: v.notes,
                            totalAmount: v.totalAmount,
                          });
                        }}
                        className="p-1.5 text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded transition-colors"
                        title="Xem trước và In Phiếu Xin Lĩnh (Mẫu 02-VT)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {canDispatch && (
                        <button
                          onClick={() => handleOpenEditExport(v)}
                          className="p-1 text-slate-400 hover:text-brand-600 rounded transition-colors"
                          title="Chỉnh sửa phiếu xuất kho"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteVoucher(v.id, v.code)}
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="Xóa phiếu và hoàn tác tồn kho"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                  </div>

                  <div className="space-y-1 bg-white p-2 rounded border border-slate-100">
                    {v.details?.map((dt: any) => {
                      const isTransfer = dt.notes?.includes('bổ sung ĐH mới sang ĐH sửa chữa');
                      return (
                        <div key={dt.id} className="space-y-0.5">
                          <div className="flex justify-between items-center text-slate-700 text-[11px]">
                            <span className="font-medium text-slate-800">
                              {dt.meter?.name}
                            </span>
                            <span className="font-semibold font-mono flex items-center gap-1">
                              {dt.quantity} cái 
                              {isTransfer ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-100 text-purple-800 font-bold border border-purple-200">
                                  Bổ sung sang SC
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">
                                  ({dt.status === 'new' ? 'Mới 100%' : 'Xưởng sửa'})
                                </span>
                              )}
                            </span>
                          </div>
                          {dt.notes && (
                            <div className="text-[10px] text-purple-700 italic pl-1">
                              • {dt.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {editingVoucherId === v.id ? (
                    <div className="pt-2 border-t flex gap-2">
                      <input
                        type="text"
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        className="flex-1 text-[11px] border rounded px-2 py-1"
                      />
                      <button
                        onClick={() => handleSaveNotes(v.id)}
                        className="px-2 py-1 bg-brand-600 text-white rounded text-[10px] font-bold"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingVoucherId(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px]"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    v.notes && (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                        {v.notes}
                      </p>
                    )
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal In & Xem trước Phiếu Xuất Kho */}
      {printModalData && (
        <PrintVoucherModal
          data={printModalData}
          onClose={() => setPrintModalData(null)}
        />
      )}

      {/* Modal Chỉnh Sửa Phiếu Xuất Kho */}
      {editingExportVoucher && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-600" />
                Chỉnh Sửa Phiếu Xuất Kho ({editingExportVoucher.code})
              </h3>
              <button
                type="button"
                onClick={() => setEditingExportVoucher(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditExport} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn Vị Nhận (*)</label>
                  <select
                    value={editDestUnitId}
                    onChange={(e) => {
                      const newId = Number(e.target.value);
                      setEditDestUnitId(newId);
                      const saved = typeof window !== 'undefined' ? localStorage.getItem(`wm_default_dist_deliverer_${newId}`) : null;
                      const uEmps = employees.filter((emp) => emp.unitId === newId);
                      setEditDeliverer(saved || uEmps[0]?.fullName || '');
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-medium focus:outline-none"
                    required
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày Lập Phiếu</label>
                  <input
                    type="date"
                    value={editVoucherDate}
                    onChange={(e) => setEditVoucherDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ParticipantSelect
                  label="Người Lập Phiếu"
                  value={editCreator}
                  onChange={setEditCreator}
                  options={khoEmployees.length > 0 ? khoEmployees : employees}
                  defaultKey="wm_default_dist_creator"
                  defaultFallback="Nguyễn Văn Tiến"
                  placeholder="Chọn người lập phiếu"
                />
                <ParticipantSelect
                  label="Người Giao (Cán bộ đơn vị)"
                  value={editDeliverer}
                  onChange={setEditDeliverer}
                  options={employees.filter((e) => e.unitId === editDestUnitId)}
                  defaultKey={`wm_default_dist_deliverer_${editDestUnitId}`}
                  placeholder="Chọn người giao"
                />
                <ParticipantSelect
                  label="Phụ Trách Kỹ Thuật"
                  value={editTechnician}
                  onChange={setEditTechnician}
                  options={khoEmployees.length > 0 ? khoEmployees : employees}
                  defaultKey="wm_default_dist_technician"
                  defaultFallback="Bùi Đức Duy"
                  placeholder="Chọn phụ trách kỹ thuật"
                />
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-semibold text-slate-700">
                    Danh Sách Đồng Hồ Xuất ({editItems.length} dòng)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditItems([...editItems, { meterId: meters[0]?.id || 1, meterStatus: 'circulating', quantity: 10 }])}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Dòng
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editItems.map((row, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border text-xs space-y-2">
                      {/* Row 1: controls */}
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <select
                            value={row.meterId}
                            onChange={(e) => {
                              const updated = [...editItems];
                              updated[idx].meterId = Number(e.target.value);
                              setEditItems(updated);
                            }}
                            className="w-full text-xs border rounded p-1.5 bg-white font-medium"
                          >
                            {meters.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-32">
                          <select
                            value={row.meterStatus}
                            onChange={(e) => {
                              const updated = [...editItems];
                              updated[idx].meterStatus = e.target.value as any;
                              setEditItems(updated);
                            }}
                            className="w-full text-xs border rounded p-1.5 bg-white font-semibold text-brand-700"
                          >
                            <option value="new">Mới 100%</option>
                            <option value="circulating">Quay vòng (SC)</option>
                          </select>
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) => {
                              const updated = [...editItems];
                              updated[idx].quantity = Number(e.target.value);
                              setEditItems(updated);
                            }}
                            placeholder="Số lượng"
                            className="w-full text-xs border rounded p-1.5 text-right font-bold"
                            required
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Row 2: ghi chú dòng */}
                      <MeterNoteCombobox
                        value={row.notes || ''}
                        onChange={(val) => {
                          const updated = [...editItems];
                          updated[idx].notes = val;
                          setEditItems(updated);
                        }}
                        placeholder="Ghi chú / Mục đích xuất dòng này..."
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú Phiếu Xuất</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="VD: Xuất cấp phục vụ thay thế mạng lưới..."
                  className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div className="text-xs">
                  <span className="text-slate-500">Tổng số lượng xuất: </span>
                  <span className="font-bold font-mono text-sm text-brand-700">
                    {editItems.reduce((acc, r) => acc + (r.quantity || 0), 0).toLocaleString()} cái
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingExportVoucher(null)}
                    className="px-4 py-2 rounded-lg border text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-500 disabled:opacity-50"
                  >
                    {loading ? 'Đang lưu...' : 'Lưu Thay Đổi Phiếu Xuất'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
