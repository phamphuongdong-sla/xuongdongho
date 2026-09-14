'use client';

import { useState, useEffect } from 'react';
import { 
  submitRepairVoucher, 
  submitSupplementRepairVoucher,
  deleteRepairVoucher, 
  updateRepairVoucherNotes,
  updateRepairVoucher
} from '@/actions/repairs';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Boxes,
  Sparkles,
  Edit2,
  ArrowRight,
  Printer,
  User
} from 'lucide-react';
import { PrintVoucherModal, VoucherPrintData } from '@/components/vouchers/PrintVoucherModal';
import { ParticipantSelect } from '@/components/vouchers/ParticipantSelect';
import type { SessionUser } from '@/types';

interface Meter {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
}

interface MeterWithNewStock extends Meter {
  newStock: number;
}

interface SparePart {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number | null;
  availableStock: number;
  inventories?: any[];
}



interface PartUsageInput {
  sparePartId: number;
  quantity: number;
}


export function RepairClientView({
  meters,
  allMeters = [],
  spareParts,
  initialVouchers,
  employees = [],
  currentUser,
  initialMeterId,
}: {
  meters: Meter[];
  allMeters?: MeterWithNewStock[];
  spareParts: SparePart[];
  initialVouchers: any[];
  employees?: any[];
  currentUser?: SessionUser | null;
  initialMeterId?: number;
}) {
  const isAdmin = currentUser ? (currentUser.role === 'admin' || currentUser.originalRole === 'admin') : true;
  const canRepair = currentUser ? (currentUser.role === 'admin' || currentUser.role === 'ktv' || currentUser.role === 'kho' || currentUser.originalRole === 'admin') : true;
  const canDelete = canRepair;

  // Participant states for Mẫu 02-VT: Phiếu Xin Lĩnh Vật Tư
  const [creatorName, setCreatorName] = useState<string>('Lương Phương Thảo');
  const [receiverName, setReceiverName] = useState<string>('Nguyễn Văn Tiến');
  const [workshopManagerName, setWorkshopManagerName] = useState<string>('Bùi Đức Duy');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCreator = localStorage.getItem('wm_default_repair_creator');
      if (savedCreator) setCreatorName(savedCreator);
      const savedReceiver = localStorage.getItem('wm_default_repair_receiver');
      if (savedReceiver) setReceiverName(savedReceiver);
      const savedManager = localStorage.getItem('wm_default_repair_manager');
      if (savedManager) setWorkshopManagerName(savedManager);
    }
  }, []);

  // Tab switcher: 'repair' vs 'supplement'
  const [activeTab, setActiveTab] = useState<'repair' | 'supplement'>('repair');

  // Filter out any unit repair meter (Đồng hồ DN15 (sửa chữa đơn vị))
  const availableRepairMeters = meters.filter(
    (m) => m.code !== 'ĐH015(SC)-DV' && !m.name.toLowerCase().includes('đơn vị')
  );

  // Default to initialMeterId or D15 repair meter (Đồng hồ DN15 (sửa chữa))
  const initialMeter = initialMeterId ? availableRepairMeters.find(m => m.id === initialMeterId) : undefined;
  const defaultMeter = initialMeter || availableRepairMeters.find(m => m.code === 'ĐH015(SC)' || (m.name.includes('DN15') && !m.name.includes('đơn vị'))) || availableRepairMeters[0];

  const [selectedMeterId, setSelectedMeterId] = useState<number>(defaultMeter?.id || (availableRepairMeters[0]?.id || 1));
  const initialWaitStock = (defaultMeter as any)?.waitingRepairStock ?? 0;
  const [inputQty, setInputQty] = useState<number>(initialWaitStock > 0 ? initialWaitStock : 10);
  const [completedQty, setCompletedQty] = useState<number>(initialWaitStock > 0 ? initialWaitStock : 9);
  const [scrappedQty, setScrappedQty] = useState<number>(initialWaitStock > 0 ? 0 : 1);
  const [notes, setNotes] = useState<string>('Sửa chữa thay thế linh kiện hao mòn');
  const [partsUsed, setPartsUsed] = useState<PartUsageInput[]>([
    { sparePartId: spareParts[0]?.id || 1, quantity: initialWaitStock > 0 ? initialWaitStock : 9 },
    { sparePartId: spareParts[1]?.id || 2, quantity: initialWaitStock > 0 ? initialWaitStock : 9 },
  ]);

  // States for Supplement workflow (Xuất bổ sung ĐH mới sang ĐH sửa chữa do thay đổi kế hoạch)
  const defaultSourceMeter = allMeters.find(m => m.newStock > 0) || allMeters[0];
  const [suppSourceMeterId, setSuppSourceMeterId] = useState<number>(defaultSourceMeter?.id || 1);
  const [suppTargetMeterId, setSuppTargetMeterId] = useState<number>(defaultMeter?.id || (availableRepairMeters[0]?.id || 1));
  const [suppQuantity, setSuppQuantity] = useState<number>(10);
  const [suppNotes, setSuppNotes] = useState<string>('Xuất bổ sung ĐH mới sang ĐH sửa chữa do thay đổi kế hoạch');

  // Edit notes state
  const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [printModalData, setPrintModalData] = useState<VoucherPrintData | null>(null);

  const selectedMeter = availableRepairMeters.find((m) => m.id === selectedMeterId) || meters.find((m) => m.id === selectedMeterId);

  // Auto-calculate: inputQty = completedQty + scrappedQty
  const handleInputQtyChange = (val: number) => {
    const qty = Math.max(0, val);
    setInputQty(qty);
    const comp = Math.max(0, qty - scrappedQty);
    setCompletedQty(comp);
  };

  const handleCompletedQtyChange = (val: number) => {
    const comp = Math.max(0, val);
    setCompletedQty(comp);
    setScrappedQty(Math.max(0, inputQty - comp));
  };

  const handleScrappedQtyChange = (val: number) => {
    const scrap = Math.max(0, val);
    setScrappedQty(scrap);
    setCompletedQty(Math.max(0, inputQty - scrap));
  };

  // Auto populate standard D15 BOM (all 13 DN15 components)
  const handleApplyD15BOM = () => {
    const d15Parts = spareParts
      .filter((p) => p.code.startsWith('VP-D15-') || p.name.toLowerCase().includes('dn15') || p.name.toLowerCase().includes('d15'))
      .map((p) => ({
        sparePartId: p.id,
        quantity: completedQty > 0 ? completedQty : 1,
      }));
    const targetParts = d15Parts.length > 0 ? d15Parts : spareParts.slice(0, 12).map((p) => ({
      sparePartId: p.id,
      quantity: completedQty > 0 ? completedQty : 1,
    }));
    setPartsUsed(targetParts);
    setMessage({
      type: 'success',
      text: `Đã tự động nạp định mức ${targetParts.length} vật tư linh kiện DN15 cho ${completedQty} đồng hồ đạt sửa chữa!`
    });
  };

  const handleAddPartRow = () => {
    const nextPart = spareParts.find((p) => !partsUsed.some((u) => u.sparePartId === p.id)) || spareParts[0];
    if (nextPart) {
      setPartsUsed([...partsUsed, { sparePartId: nextPart.id, quantity: completedQty > 0 ? completedQty : 1 }]);
    }
  };

  const handleRemovePartRow = (index: number) => {
    setPartsUsed(partsUsed.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, sparePartId: number) => {
    const updated = [...partsUsed];
    updated[index].sparePartId = sparePartId;
    setPartsUsed(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...partsUsed];
    updated[index].quantity = Math.max(0, qty);
    setPartsUsed(updated);
  };

  // Stock check validation
  const hasDeficit = partsUsed.some((p) => {
    const sp = spareParts.find((s) => s.id === p.sparePartId);
    return sp ? p.quantity > sp.availableStock : false;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (completedQty + scrappedQty > inputQty) {
      setMessage({ type: 'error', text: 'Tổng số ĐH hoàn thành + hỏng không được vượt quá số nhận sửa!' });
      return;
    }

    if (hasDeficit) {
      setMessage({ type: 'error', text: 'Có linh kiện không đủ tồn kho để xuất. Vui lòng kiểm tra lại!' });
      return;
    }

    setLoading(true);
    try {
      const repairData = {
        meterId: selectedMeterId,
        inputQuantity: inputQty,
        completedQuantity: completedQty,
        scrappedQuantity: scrappedQty,
        notes,
        partsUsed: partsUsed.filter((p) => p.quantity > 0),
        creatorName,
        receiverName,
        workshopManagerName,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('wm_default_repair_creator', creatorName);
        localStorage.setItem('wm_default_repair_receiver', receiverName);
        localStorage.setItem('wm_default_repair_manager', workshopManagerName);
      }

      const res = editingVoucherId
        ? await updateRepairVoucher({ id: editingVoucherId, ...repairData })
        : await submitRepairVoucher(repairData);

      if (!res.success) {
        setMessage({ type: 'error', text: res.error || 'Lỗi khi lưu phiếu sửa chữa' });
        return;
      }

      setMessage({
        type: 'success',
        text: editingVoucherId
          ? `Đã cập nhật phiếu sửa chữa ${res.code}. Tồn đồng hồ, linh kiện và báo cáo đã được tính lại.`
          : `Đã lập phiếu sửa chữa thành công (${res.code})! Đã xuất trừ linh kiện và nhập ${completedQty} ĐH vào kho quay vòng xưởng.`,
      });
      setEditingVoucherId(null);
      // Reset default
      setInputQty(10);
      setCompletedQty(9);
      setScrappedQty(1);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi lưu phiếu sửa chữa' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = async (id: number, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa phiếu sửa chữa ${code}? Toàn bộ linh kiện đã dùng sẽ được hoàn trả vào kho xưởng và trừ số đồng hồ quay vòng đã nhập.`)) return;
    setLoading(true);
    try {
      const res = await deleteRepairVoucher(id);
      if (!res.success) {
        setMessage({ type: 'error', text: res.error || 'Lỗi khi xóa phiếu sửa chữa' });
        return;
      }
      setMessage({ type: 'success', text: `Đã xóa phiếu ${code} và hoàn tác tồn kho thành công!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async (id: number) => {
    setLoading(true);
    try {
      const res = await updateRepairVoucherNotes(id, editingNotes);
      if (!res.success) {
        setMessage({ type: 'error', text: res.error || 'Lỗi khi cập nhật ghi chú' });
        return;
      }
      setMessage({ type: 'success', text: 'Đã cập nhật ghi chú phiếu sửa chữa thành công!' });
      setEditingVoucherId(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEditVoucher = (voucher: any) => {
    if (voucher.code.includes('BS') || voucher.notes?.includes('[Nguồn:')) {
      setMessage({ type: 'error', text: 'Phiếu xuất bổ sung cần xóa và lập lại để giữ đúng lịch sử nguồn đồng hồ mới.' });
      return;
    }
    setActiveTab('repair');
    setEditingVoucherId(voucher.id);
    setSelectedMeterId(voucher.meterId);
    setInputQty(voucher.inputQuantity);
    setCompletedQty(voucher.completedQuantity);
    setScrappedQty(voucher.scrappedQuantity);
    setNotes(voucher.notes || '');
    if (voucher.delivererName) setCreatorName(voucher.delivererName);
    if (voucher.receiverName) setReceiverName(voucher.receiverName);
    setPartsUsed((voucher.sparePartUsages || []).map((usage: any) => ({
      sparePartId: usage.sparePartId,
      quantity: usage.quantity,
    })));
    setMessage({ type: 'success', text: `Đang chỉnh sửa ${voucher.code}. Thay đổi đồng hồ hoặc linh kiện rồi bấm cập nhật phiếu.` });
  };

  const handlePrintRepairIssue = (voucher: any) => {
    const items = (voucher.sparePartUsages || []).map((usage: any) => ({
      code: usage.sparePart?.code,
      name: usage.sparePart?.name || 'Linh kiện sửa chữa',
      unit: usage.sparePart?.unit || 'Cái',
      actualQuantity: usage.quantity,
      unitPrice: usage.unitPrice || 0,
      amount: usage.quantity * (usage.unitPrice || 0),
      notes: `Dùng sửa ${voucher.meter?.name || 'đồng hồ'}`,
    }));
    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Phiếu này không có linh kiện xuất dùng để in.' });
      return;
    }

    const savedCreator = typeof window !== 'undefined' ? localStorage.getItem('wm_default_repair_creator') : null;
    const savedReceiver = typeof window !== 'undefined' ? localStorage.getItem('wm_default_repair_receiver') : null;
    const savedManager = typeof window !== 'undefined' ? localStorage.getItem('wm_default_repair_manager') : null;

    setPrintModalData({
      type: 'export',
      code: `${voucher.code}-LK`,
      voucherDate: voucher.repairDate,
      creatorName: voucher.delivererName || savedCreator || creatorName || 'Lương Phương Thảo',
      receiverName: voucher.receiverName || savedReceiver || receiverName || 'Nguyễn Văn Tiến',
      workshopManagerName: savedManager || workshopManagerName || 'Bùi Đức Duy',
      destinationOrSupplier: 'Xưởng đồng hồ',
      warehouseName: 'Xưởng đồng hồ',
      reason: `Xuất linh kiện thực hiện phiếu sửa chữa ${voucher.code}`,
      customTitle: 'PHIẾU XIN LĨNH VẬT TƯ',
      voucherCategory: 'repair_material_export',
      items,
      notes: voucher.notes,
    });
  };

  const selectedSourceMeter = allMeters.find((m) => m.id === suppSourceMeterId);
  const availableNewStock = selectedSourceMeter?.newStock || 0;
  const isSuppOver = suppQuantity > availableNewStock;

  const handleSourceMeterChange = (id: number) => {
    setSuppSourceMeterId(id);
    const src = allMeters.find((m) => m.id === id);
    if (src) {
      // Auto-match repair meter (SC) if available
      const match = meters.find(
        (m) => m.code === `${src.code}(SC)` || m.code.includes(src.code) || m.name.includes(src.name)
      );
      if (match) {
        setSuppTargetMeterId(match.id);
      }
    }
  };

  const handleSupplementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (suppQuantity <= 0) {
      setMessage({ type: 'error', text: 'Số lượng bổ sung phải lớn hơn 0!' });
      return;
    }

    if (suppQuantity > availableNewStock) {
      setMessage({
        type: 'error',
        text: `Không đủ tồn kho ĐH Mới tại Kho VP cho ${selectedSourceMeter?.name} (Khả dụng: ${availableNewStock}, Yêu cầu: ${suppQuantity})!`,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await submitSupplementRepairVoucher({
        sourceMeterId: suppSourceMeterId,
        targetMeterId: suppTargetMeterId,
        quantity: suppQuantity,
        notes: suppNotes,
      });

      if (!res.success) {
        setMessage({ type: 'error', text: res.error || 'Lỗi khi lưu phiếu xuất bổ sung' });
        return;
      }

      setMessage({
        type: 'success',
        text: `Đã lập phiếu xuất bổ sung thành công (${res.code})! Đã trừ ${suppQuantity} ĐH mới tại kho VP và tăng kho ĐH quay vòng xưởng.`,
      });
      setSuppQuantity(10);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi lưu phiếu xuất bổ sung' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Column (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Tab Navigation */}
        <div className="flex border border-slate-200 bg-slate-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('repair'); setMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'repair'
                ? 'bg-white text-brand-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Wrench className="w-4 h-4 text-brand-600" />
            1. Xưởng Sửa Chữa & Trừ Linh Kiện
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('supplement'); setMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'supplement'
                ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            2. Xuất Bổ Sung ĐH Mới Sang ĐH Sửa Chữa
          </button>
        </div>

        {activeTab === 'repair' ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-brand-600" />
              Lập Phiếu Sửa Chữa Đồng Hồ & Xuất Linh Kiện
            </h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded ${editingVoucherId ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'}`}>
              {editingVoucherId ? 'Đang Chỉnh Sửa Phiếu' : 'Nhập Kho Xưởng Hoàn Tất'}
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

          {/* Section 1: Meter selection & quantities */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Chọn Loại Đồng Hồ Sửa Chữa <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {selectedMeter && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Tồn chờ sửa: {(selectedMeter as any).waitingRepairStock ?? 0} cái
                    </span>
                  )}
                  <span className="text-[11px] text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded">
                    Đồng hồ sửa chữa
                  </span>
                </div>
              </div>
              <select
                value={selectedMeterId}
                onChange={(e) => {
                  const mId = Number(e.target.value);
                  setSelectedMeterId(mId);
                  const m = availableRepairMeters.find(x => x.id === mId);
                  const waitQty = (m as any)?.waitingRepairStock ?? 0;
                  if (waitQty > 0) {
                    setInputQty(waitQty);
                    setCompletedQty(waitQty);
                    setScrappedQty(0);
                  }
                }}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {availableRepairMeters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {((m as any).waitingRepairStock ?? 0) > 0 ? `(Chờ sửa: ${(m as any).waitingRepairStock} cái)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số nhận sửa (cái)
                </label>
                <input
                  type="number"
                  min={1}
                  value={inputQty}
                  onChange={(e) => handleInputQtyChange(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-700 mb-1">
                  Đạt - Nhập kho quay vòng
                </label>
                <input
                  type="number"
                  min={0}
                  value={completedQty}
                  onChange={(e) => handleCompletedQtyChange(Number(e.target.value))}
                  className="w-full text-sm border border-emerald-300 bg-emerald-50/40 rounded-lg px-3 py-2 font-semibold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Hỏng nặng loại bỏ
                </label>
                <input
                  type="number"
                  min={0}
                  value={scrappedQty}
                  onChange={(e) => handleScrappedQtyChange(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-400 focus:outline-none font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú phiếu sửa chữa</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Thay thế cánh quạt, gioăng và chụp xoay..."
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Spare Parts Breakdown */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-brand-600" />
                  Báo Xuất Linh Kiện Đã Dùng Cho Đồng Hồ Sửa Chữa
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống tự động trừ kho linh kiện theo số lượng thực tế khai báo.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApplyD15BOM}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200/60"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Nạp Định Mức D15 (BOM)
                </button>
                <button
                  type="button"
                  onClick={handleAddPartRow}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm Linh Kiện
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {partsUsed.map((row, idx) => {
                const part = spareParts.find((s) => s.id === row.sparePartId);
                const isOverStock = part ? row.quantity > part.availableStock : false;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs transition-colors ${
                      isOverStock ? 'bg-red-50/60 border-red-200' : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex-1">
                      <select
                        value={row.sparePartId}
                        onChange={(e) => handlePartChange(idx, Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white focus:outline-none"
                      >
                        {spareParts.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name} — Tồn kho: {sp.availableStock} {sp.unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                        className="w-full text-xs text-right border border-slate-200 rounded px-2 py-1.5 focus:outline-none font-semibold"
                        placeholder="Số lượng"
                        required
                      />
                    </div>

                    <div className="w-24 text-right text-[11px]">
                      <span className={`font-semibold ${isOverStock ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                        Tồn: {part?.availableStock ?? 0}
                      </span>
                      {isOverStock && <span className="block text-[10px] text-red-600 font-bold">Thiếu!</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePartRow(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Người tham gia ký phiếu (In Phiếu Xin Lĩnh Vật Tư - Mẫu 02-VT) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                Cán Bộ Tham Gia Ký Phiếu (Phiếu Xin Lĩnh Vật Tư - Mẫu 02-VT)
              </h3>
              <p className="text-xs text-slate-500">
                Thiết lập cán bộ hiển thị trên Phiếu Xin Lĩnh Vật Tư. Hệ thống tự động ghi nhớ mặc định cho các lần lập tiếp theo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ParticipantSelect
                label="Người lập phiếu"
                value={creatorName}
                onChange={setCreatorName}
                options={employees}
                defaultKey="wm_default_repair_creator"
                defaultFallback="Lương Phương Thảo"
                placeholder="Chọn người lập phiếu"
                required
              />

              <ParticipantSelect
                label="Người nhận hàng"
                value={receiverName}
                onChange={setReceiverName}
                options={employees}
                defaultKey="wm_default_repair_receiver"
                defaultFallback="Nguyễn Văn Tiến"
                placeholder="Chọn người nhận hàng"
                required
              />

              <ParticipantSelect
                label="Xưởng đồng hồ"
                value={workshopManagerName}
                onChange={setWorkshopManagerName}
                options={employees}
                defaultKey="wm_default_repair_manager"
                defaultFallback="Bùi Đức Duy"
                placeholder="Chọn phụ trách xưởng"
                required
              />
            </div>
          </div>

          {canRepair ? (
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || hasDeficit}
                className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Đang Xử Lý & Xuất Trừ Kho...' : editingVoucherId ? 'Cập Nhật Phiếu Sửa Chữa' : 'Hoàn Tất Sửa Chữa & Nhập Kho Quay Vòng'}
              </button>
              {editingVoucherId && (
                <button type="button" onClick={() => setEditingVoucherId(null)} className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50">
                  Hủy sửa
                </button>
              )}
            </div>
          ) : (
            <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs border border-slate-200 text-center">
              Chế độ chỉ xem xưởng (Chỉ đọc)
            </div>
          )}
        </form>

        ) : (
        /* Tab 2: Supplement Form (Xuất bổ sung ĐH mới sang ĐH sửa chữa do thay đổi kế hoạch) */
        <form onSubmit={handleSupplementSubmit} className="bg-white rounded-xl border border-purple-200 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-purple-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Xuất Bổ Sung ĐH Mới Sang ĐH Sửa Chữa
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Áp dụng khi thay đổi kế hoạch: chuyển ĐH mới thành ĐH sửa chữa / quay vòng tại xưởng
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
              Thay Đổi Kế Hoạch
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

          <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/80 text-xs text-purple-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-purple-800">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              Quy trình xuất bổ sung do thay đổi kế hoạch:
            </p>
            <p className="text-purple-700 text-[11px] leading-relaxed">
              • Giảm trừ số lượng từ <strong>Kho ĐH Mới 100%</strong> tại Kho VP.<br />
              • Tăng số lượng vào <strong>Kho ĐH Sửa Chữa / Quay Vòng</strong> để xưởng sẵn sàng cấp phát.<br />
              • Không trừ linh kiện phụ tùng và tự động phản ánh vào Báo cáo đối soát 25 SKU đồng hồ.
            </p>
          </div>

          {/* Section: Source Meter and Target Meter */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Chọn Đồng Hồ Mới Nguồn (Lấy từ Kho ĐH Mới VP) <span className="text-red-500">*</span>
              </label>
              <select
                value={suppSourceMeterId}
                onChange={(e) => handleSourceMeterChange(Number(e.target.value))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {allMeters.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.code}] {m.name} — Tồn Mới khả dụng: {m.newStock} cái
                  </option>
                ))}
              </select>
              <div className="mt-1 flex justify-between text-[11px]">
                <span className="text-slate-500">Tồn kho ĐH Mới hiện có tại Kho VP:</span>
                <span className={`font-mono font-bold ${availableNewStock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {availableNewStock} cái
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center my-1">
              <div className="p-1.5 rounded-full bg-purple-100 text-purple-600">
                <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Chọn Đồng Hồ Sửa Chữa Đích (Nhập vào Kho Quay Vòng Xưởng) <span className="text-red-500">*</span>
              </label>
              <select
                value={suppTargetMeterId}
                onChange={(e) => setSuppTargetMeterId(Number(e.target.value))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {availableRepairMeters.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.code}] {m.name} (Đồng hồ sửa chữa / quay vòng)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Số Lượng Bổ Sung (cái) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={availableNewStock || 1}
                value={suppQuantity}
                onChange={(e) => setSuppQuantity(Number(e.target.value))}
                className={`w-full text-sm border rounded-lg px-3 py-2.5 font-bold focus:ring-2 focus:outline-none ${
                  isSuppOver ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500' : 'border-slate-200 focus:ring-purple-500'
                }`}
                required
              />
              {isSuppOver && (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  Vượt quá số lượng ĐH Mới hiện có ({availableNewStock} cái)!
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Ghi Chú Kế Hoạch Điều Chuyển (Có thể tự sửa)
              </label>
              <input
                type="text"
                value={suppNotes}
                onChange={(e) => setSuppNotes(e.target.value)}
                placeholder="Ghi chú điều chuyển..."
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800"
              />
            </div>
          </div>

          {canRepair ? (
            <button
              type="submit"
              disabled={loading || isSuppOver || availableNewStock === 0}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Đang Xử Lý Bổ Sung...' : 'Xác Nhận Xuất Bổ Sung Sang ĐH Sửa Chữa'}
            </button>
          ) : (
            <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs border border-slate-200 text-center">
              Chế độ chỉ xem xưởng (Chỉ đọc)
            </div>
          )}
        </form>

        )}
      </div>

      {/* History Column (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              Lịch Sử Phiếu Xưởng Sửa Chữa & Bổ Sung
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {initialVouchers.length} phiếu
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {initialVouchers.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">Chưa có phiếu sửa chữa nào.</p>
            ) : (
              initialVouchers.map((v) => {
                const isSupplement = v.code.includes('BS') || v.notes?.includes('[Nguồn:') || v.notes?.includes('bổ sung');
                return (
                  <div
                    key={v.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-2 transition-colors shadow-xs ${
                      isSupplement
                        ? 'border-purple-200 bg-purple-50/40 hover:bg-white'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                          isSupplement
                            ? 'text-purple-800 bg-purple-100 border-purple-300'
                            : 'text-brand-700 bg-brand-50 border-brand-200/60'
                        }`}>
                          {v.code}
                        </span>
                        <span className="ml-2 font-semibold text-slate-900">{v.meter.name}</span>
                        {isSupplement && (
                          <span className="ml-2 inline-block text-[10px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded">
                            Bổ sung ĐH Mới
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400 mr-1">
                          {new Date(v.repairDate).toLocaleDateString('vi-VN')}
                        </span>
                        {canRepair && (
                          <button
                            onClick={() => handleEditVoucher(v)}
                            className="p-1 text-slate-400 hover:text-brand-600"
                            title="Sửa phiếu, đồng hồ và linh kiện"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintRepairIssue(v)}
                          className="p-1 text-slate-400 hover:text-brand-600"
                          title="In hoặc lưu phiếu xuất linh kiện"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteVoucher(v.id, v.code)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title={isSupplement ? "Xóa phiếu và hoàn tác ĐH Mới" : "Xóa phiếu và hoàn tác tồn kho"}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                    </div>

                    {isSupplement ? (
                      <div className="flex gap-4 text-purple-900 font-medium">
                        <span>Số lượng bổ sung: <strong className="text-purple-700 font-bold">{v.completedQuantity}</strong> cái</span>
                        <span className="text-emerald-700">Đã nhập kho quay vòng</span>
                      </div>
                    ) : (
                      <div className="flex gap-4 text-slate-700">
                        <span>Nhận sửa: <strong>{v.inputQuantity}</strong></span>
                        <span className="text-emerald-700">Đạt nhập kho: <strong>{v.completedQuantity}</strong></span>
                        {v.scrappedQuantity > 0 && (
                          <span className="text-slate-500">Hỏng: <strong>{v.scrappedQuantity}</strong></span>
                        )}
                      </div>
                    )}

                    {v.sparePartUsages?.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                        <p className="font-semibold text-slate-700">Linh kiện đã xuất dùng:</p>
                        <div className="flex flex-wrap gap-1">
                          {v.sparePartUsages.map((u: any) => (
                            <span
                              key={u.id}
                              className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700"
                            >
                              {u.sparePart.name}: <strong>{u.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {v.notes && (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                        {v.notes}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {printModalData && <PrintVoucherModal data={printModalData} onClose={() => setPrintModalData(null)} />}
    </div>
  );
}
