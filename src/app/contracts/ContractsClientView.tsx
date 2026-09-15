'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  createContract, 
  updateContract, 
  deleteContract, 
  createContractBatch, 
  updateContractBatch, 
  deleteContractBatch,
  importBatchGoods,
  updateImportVoucher,
  deleteImportVoucher
} from '@/actions/contracts';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Boxes, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertCircle,
  Building,
  DollarSign,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Gauge,
  Sparkles,
  Download,
  Upload,
  Printer,
  Search,
  Filter,
  X
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
  unitPrice: number;
  inventories?: any[];
}

interface SparePart {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  currentStock: number;
}

interface ImportRow {
  itemType: 'spare_part' | 'meter';
  itemId: number;
  quantity: number;
  unitPrice: number;
}

export function ContractsClientView({
  contracts,
  meters,
  spareParts,
  initialImports,
  employees = [],
  currentUser,
}: {
  contracts: any[];
  meters: Meter[];
  spareParts: SparePart[];
  initialImports: any[];
  employees?: any[];
  currentUser?: SessionUser | null;
}) {
  const isAdmin = currentUser ? (currentUser.role === 'admin' || currentUser.originalRole === 'admin') : true;
  const canEdit = currentUser ? (currentUser.role === 'admin' || currentUser.role === 'kho' || currentUser.originalRole === 'admin') : true;
  const canDelete = canEdit;

  const router = useRouter();
  const [selectedContractId, setSelectedContractId] = useState<number>(contracts[0]?.id || 1);

  // Sync import vouchers list
  const [importList, setImportList] = useState<any[]>(initialImports);
  useEffect(() => {
    setImportList(initialImports);
  }, [initialImports]);

  // Year filter & Search filter for Import Voucher History
  const [importYearFilter, setImportYearFilter] = useState<string>('2026');
  const [importSearchTerm, setImportSearchTerm] = useState<string>('');

  const availableImportYears = useMemo(() => {
    const years = new Set<number>();
    years.add(2026);
    importList.forEach((imp) => {
      if (imp.voucherDate) {
        const y = new Date(imp.voucherDate).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [importList]);

  const filteredImports = useMemo(() => {
    return importList.filter((imp) => {
      const impYear = imp.voucherDate ? new Date(imp.voucherDate).getFullYear().toString() : '';
      const matchYear = importYearFilter === 'all' || impYear === importYearFilter;
      if (!matchYear) return false;

      if (!importSearchTerm.trim()) return true;
      const term = importSearchTerm.toLowerCase();
      const matchCode = imp.code?.toLowerCase().includes(term);
      const matchContract = imp.contract?.contractNumber?.toLowerCase().includes(term);
      const matchBatch = imp.batch?.batchName?.toLowerCase().includes(term);
      const matchDeliverer = imp.delivererName?.toLowerCase().includes(term);
      const matchReceiver = imp.receiverName?.toLowerCase().includes(term);
      const matchNotes = imp.notes?.toLowerCase().includes(term);
      const matchItems = imp.details?.some((d: any) => {
        const name = d.meterId ? d.meter?.name : d.sparePart?.name;
        const code = d.meterId ? d.meter?.code : d.sparePart?.code;
        return name?.toLowerCase().includes(term) || code?.toLowerCase().includes(term);
      });

      return matchCode || matchContract || matchBatch || matchDeliverer || matchReceiver || matchNotes || matchItems;
    });
  }, [importList, importYearFilter, importSearchTerm]);

  // Modals
  const [showContractModal, setShowContractModal] = useState(false);
  const [editingContract, setEditingContract] = useState<any | null>(null);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [editingImportVoucher, setEditingImportVoucher] = useState<any | null>(null);
  const [editingVoucherDate, setEditingVoucherDate] = useState<string>('');

  // 3 Cán bộ ký phiếu theo quy định
  const [customerDeptName, setCustomerDeptName] = useState<string>('Phạm Phương Đông');
  const [creatorName, setCreatorName] = useState<string>('Nguyễn Văn Tiến');
  const [workshopManagerName, setWorkshopManagerName] = useState<string>('Bùi Đức Duy');

  // Contract Form State
  const [contractNumber, setContractNumber] = useState('');
  const [contractTitle, setContractTitle] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [totalValue, setTotalValue] = useState<number>(100000000);
  const [contractStatus, setContractStatus] = useState('active');
  const [contractNotes, setContractNotes] = useState('');

  // Batch Form State
  const [batchName, setBatchName] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [batchStatus, setBatchStatus] = useState('pending');
  const [batchNotes, setBatchNotes] = useState('');

  // Import Goods Form State
  const [importBatchId, setImportBatchId] = useState<number>(0);
  const [importRows, setImportRows] = useState<ImportRow[]>([
    { itemType: 'meter', itemId: meters[0]?.id || 1, quantity: 200, unitPrice: meters[0]?.unitPrice || 350000 },
    { itemType: 'spare_part', itemId: spareParts[0]?.id || 1, quantity: 500, unitPrice: spareParts[0]?.unitPrice || 14300 },
  ]);
  const [importNotes, setImportNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [printModalData, setPrintModalData] = useState<VoucherPrintData | null>(null);

  const selectedContract = contracts.find((c) => c.id === selectedContractId) || contracts[0];

  // Helper: Load Excel Template Sample Data
  const handleLoadExcelSampleData = () => {
    // Builds sample rows of new meters + key spare parts from SOWASUCO Excel spec
    const sampleRows: ImportRow[] = [
      { itemType: 'meter', itemId: meters.find(m => m.code === 'ĐH015')?.id || meters[0].id, quantity: 1500, unitPrice: 350000 },
      { itemType: 'meter', itemId: meters.find(m => m.code === 'ĐH025')?.id || meters[0].id, quantity: 200, unitPrice: 580000 },
      { itemType: 'meter', itemId: meters.find(m => m.code === 'ĐH040')?.id || meters[0].id, quantity: 50, unitPrice: 1250000 },
      { itemType: 'spare_part', itemId: spareParts[0]?.id || 1, quantity: 2000, unitPrice: 14300 },
      { itemType: 'spare_part', itemId: spareParts[1]?.id || 2, quantity: 1500, unitPrice: 22750 },
      { itemType: 'spare_part', itemId: spareParts[3]?.id || 4, quantity: 800, unitPrice: 179400 },
      { itemType: 'spare_part', itemId: spareParts[4]?.id || 5, quantity: 1000, unitPrice: 32500 },
    ];
    setImportRows(sampleRows);
    setMessage({
      type: 'success',
      text: 'Đã nạp thành công 7 mặt hàng mẫu (Đồng hồ mới D15, D25, D40 & linh kiện) từ file Excel mẫu!',
    });
  };

  // Helper: Upload & Parse Excel Template with filled quantities
  const handleUploadExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/contracts/template', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi đọc file Excel');
      }

      if (!data.items || data.items.length === 0) {
        setMessage({
          type: 'error',
          text: 'File Excel không có dòng nào có số lượng lớn hơn 0! Vui lòng điền số lượng vào cột "Số Lượng Nhập (Điền vào đây)".',
        });
        return;
      }

      const parsedRows: ImportRow[] = data.items.map((i: any) => ({
        itemType: i.itemType,
        itemId: i.itemId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }));

      setImportRows(parsedRows);
      setMessage({
        type: 'success',
        text: `Đã nạp thành công ${data.count} mặt hàng từ file Excel (Tổng số lượng: ${data.totalQuantity.toLocaleString()} cái)!`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // Open Contract Modal (Create or Edit)
  const handleOpenContractModal = (c?: any) => {
    if (c) {
      setEditingContract(c);
      setContractNumber(c.contractNumber);
      setContractTitle(c.title);
      setSupplierName(c.supplierName);
      setTotalValue(c.totalValue || 0);
      setContractStatus(c.status || 'active');
      setContractNotes(c.notes || '');
    } else {
      setEditingContract(null);
      setContractNumber(`HD-2026-${String(contracts.length + 1).padStart(3, '0')}`);
      setContractTitle('Hợp đồng mua sắm vật tư linh kiện & đồng hồ mới đợt mới 2026');
      setSupplierName('Công ty CP Thiết bị Nước Sài Gòn');
      setTotalValue(250000000);
      setContractStatus('active');
      setContractNotes('');
    }
    setShowContractModal(true);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingContract) {
        await updateContract(editingContract.id, {
          contractNumber,
          title: contractTitle,
          supplierName,
          totalValue,
          status: contractStatus,
          notes: contractNotes,
        });
        setMessage({ type: 'success', text: `Đã cập nhật hợp đồng ${contractNumber} thành công!` });
      } else {
        const res = await createContract({
          contractNumber,
          title: contractTitle,
          supplierName,
          totalValue,
          notes: contractNotes,
        });
        setMessage({ type: 'success', text: `Đã tạo hợp đồng mới ${contractNumber} thành công!` });
        setSelectedContractId(res.contract.id);
      }
      setShowContractModal(false);
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hợp đồng này và hoàn tác toàn bộ dữ liệu nhập kho liên quan?')) return;
    setLoading(true);
    try {
      await deleteContract(id);
      setMessage({ type: 'success', text: 'Đã xóa hợp đồng và hoàn tác tồn kho thành công!' });
      if (selectedContractId === id && contracts.length > 1) {
        setSelectedContractId(contracts[0].id);
      }
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Open Batch Modal (Create or Edit)
  const handleOpenBatchModal = (b?: any) => {
    if (b) {
      setEditingBatch(b);
      setBatchName(b.batchName);
      setBatchStatus(b.status || 'pending');
      setBatchNotes(b.notes || '');
    } else {
      setEditingBatch(null);
      setBatchName(`Đợt ${(selectedContract?.batches?.length || 0) + 1} - Cung ứng Quý ${Math.min(4, (selectedContract?.batches?.length || 0) + 1)}/2026`);
      setExpectedDate('');
      setBatchStatus('pending');
      setBatchNotes('');
    }
    setShowBatchModal(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingBatch) {
        await updateContractBatch(editingBatch.id, {
          batchName,
          status: batchStatus,
          notes: batchNotes,
        });
        setMessage({ type: 'success', text: `Đã cập nhật đợt giao hàng thành công!` });
      } else {
        await createContractBatch({
          contractId: selectedContractId,
          batchName,
          expectedDate: expectedDate || undefined,
          notes: batchNotes,
        });
        setMessage({ type: 'success', text: `Đã tạo đợt giao hàng mới thành công!` });
      }
      setShowBatchModal(false);
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đợt giao hàng này?')) return;
    setLoading(true);
    try {
      await deleteContractBatch(batchId);
      setMessage({ type: 'success', text: 'Đã xóa đợt giao hàng thành công!' });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditImport = (imp: any) => {
    setModalError(null);
    setEditingImportVoucher(imp);
    setEditingVoucherDate(imp.voucherDate ? new Date(imp.voucherDate).toISOString().split('T')[0] : '');
    setImportNotes(imp.notes || '');
    setCustomerDeptName(imp.delivererName || imp.customerDeptName || 'Đại diện bên giao hàng');
    setCreatorName(imp.receiverName || 'Nguyễn Văn Tiến');
    setWorkshopManagerName(imp.technicianName || 'Bùi Đức Duy');
    if (imp.contractId) setSelectedContractId(imp.contractId);
    if (imp.contractBatchId) setImportBatchId(imp.contractBatchId);
    if (imp.details && imp.details.length > 0) {
      setImportRows(
        imp.details.map((d: any) => ({
          itemType: d.meterId ? 'meter' : 'spare_part',
          itemId: d.meterId || d.sparePartId || 1,
          quantity: d.quantity || 1,
          unitPrice: d.unitPrice || 0,
        }))
      );
    }
    setShowImportModal(true);
  };

  // Import Goods Submit
  const handleImportGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setModalError(null);
    try {
      if (editingImportVoucher) {
        const updateRes = await updateImportVoucher(editingImportVoucher.id, {
          voucherDate: editingVoucherDate || undefined,
          notes: importNotes,
          customerDeptName,
          delivererName: customerDeptName,
          creatorName,
          workshopManagerName,
          items: importRows.filter(r => r.quantity > 0).map(r => ({
            itemType: r.itemType,
            itemId: r.itemId,
            quantity: r.quantity,
          })),
        });

        if (updateRes && (updateRes as any).voucher) {
          const uv = (updateRes as any).voucher;
          setImportList(prev => prev.map(v => v.id === uv.id ? uv : v));
        } else {
          setImportList(prev => prev.map(v => {
            if (v.id === editingImportVoucher.id) {
              return {
                ...v,
                voucherDate: editingVoucherDate ? new Date(editingVoucherDate) : v.voucherDate,
                notes: importNotes,
                delivererName: customerDeptName,
                customerDeptName: customerDeptName,
                receiverName: creatorName,
                technicianName: workshopManagerName,
              };
            }
            return v;
          }));
        }

        setMessage({
          type: 'success',
          text: `Đã cập nhật thành công phiếu nhập ${editingImportVoucher.code} và đồng bộ tồn kho!`,
        });
        setEditingImportVoucher(null);
        setShowImportModal(false);
        router.refresh();
      } else {
        if (!importBatchId) {
          setModalError('Vui lòng chọn đợt nhập theo hợp đồng!');
          setMessage({ type: 'error', text: 'Vui lòng chọn đợt nhập theo hợp đồng!' });
          setLoading(false);
          return;
        }
        const res = await importBatchGoods({
          contractId: selectedContractId,
          batchId: importBatchId,
          items: importRows.filter(r => r.quantity > 0),
          notes: importNotes,
          customerDeptName,
          creatorName,
          workshopManagerName,
        });
        setMessage({
          type: 'success',
          text: `Đã nhập kho thành công phiếu ${res.code}! Đã tự động cập nhật tồn kho linh kiện và đồng hồ mới vào Kho VP.`,
        });
        setShowImportModal(false);
        router.refresh();
      }
    } catch (err: any) {
      setModalError(err.message || 'Lỗi khi lưu phiếu nhập');
      setMessage({ type: 'error', text: err.message || 'Lỗi khi lưu phiếu nhập' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = async (voucherId: number, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa phiếu nhập ${code}? Số lượng đã nhập sẽ được trừ khỏi tồn kho.`)) return;
    setLoading(true);
    try {
      await deleteImportVoucher(voucherId);
      setMessage({ type: 'success', text: `Đã xóa phiếu nhập ${code} và hoàn trả tồn kho!` });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setImportRows([
      ...importRows,
      { itemType: 'spare_part', itemId: spareParts[0]?.id || 1, quantity: 100, unitPrice: spareParts[0]?.unitPrice || 0 }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setImportRows(importRows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between gap-2.5 ${
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
          <button onClick={() => setMessage(null)} className="text-xs font-bold text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Contract Manager Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Danh Sách Hợp Đồng Mua Sắm
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý hợp đồng mua sắm linh kiện và đồng hồ mới nhiều đợt trong năm
            </p>
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleOpenContractModal()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Hợp Đồng
              </button>
              <button
                onClick={() => handleOpenBatchModal()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200/60 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Đợt Giao Hàng
              </button>
              <button
                onClick={() => {
                  if (selectedContract?.batches?.length > 0) {
                    setImportBatchId(selectedContract.batches[0].id);
                  }
                  setShowImportModal(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-500 shadow-sm shadow-brand-500/20 transition-colors"
              >
                <Boxes className="w-3.5 h-3.5" />
                Nhập Kho (ĐH Mới & Linh Kiện)
              </button>
            </div>
          )}
        </div>


        {/* Contract Selector Tabs */}
        <div className="flex overflow-x-auto gap-2 border-b border-slate-100 pb-2">
          {contracts.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedContractId(c.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedContractId === c.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{c.contractNumber}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedContractId === c.id ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {c.batches?.length || 0} đợt
              </span>
            </button>
          ))}
        </div>

        {/* Selected Contract Info Details */}
        {selectedContract && (
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên Hợp Đồng / Gói Thầu</span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">{selectedContract.title}</p>
              </div>

              <div className="flex gap-2">
                {canEdit && (
                  <button
                    onClick={() => handleOpenContractModal(selectedContract)}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Sửa
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteContract(selectedContract.id)}
                    className="p-1.5 rounded-md hover:bg-red-100 text-red-600 flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                )}
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200/60">
              <div>
                <p className="text-slate-500 font-medium">Số Hợp Đồng</p>
                <p className="text-sm font-black text-brand-800 font-mono mt-0.5">{selectedContract.contractNumber}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Đơn Vị Cung Cấp</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {selectedContract.supplierName}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Giá Trị Hợp Đồng</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">
                  {(selectedContract.totalValue || 0).toLocaleString()} đ
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Trạng Thái</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  {selectedContract.status === 'active' ? 'Đang thực hiện' : 'Hoàn thành'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Batches Timeline */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Các Đợt Cung Cấp Trong Năm Của Hợp Đồng
            </h3>
            <span className="text-xs text-slate-500">
              {selectedContract?.batches?.length || 0} đợt giao nhận
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedContract?.batches?.map((b: any) => {
              const isDone = b.status === 'completed';
              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-xl border text-xs space-y-2 transition-all relative group ${
                    isDone 
                      ? 'bg-emerald-50/40 border-emerald-200/80' 
                      : 'bg-amber-50/40 border-amber-200/80'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isDone ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      Đợt {b.batchNumber}
                    </span>
                    
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenBatchModal(b)}
                          className="p-1 hover:text-brand-600 text-slate-400"
                          title="Sửa đợt"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteBatch(b.id)}
                          className="p-1 hover:text-red-600 text-slate-400"
                          title="Xóa đợt"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                  </div>

                  <p className="font-bold text-slate-900 text-sm">{b.batchName}</p>
                  <p className="text-slate-600 text-[11px]">{b.notes || 'Cung ứng linh kiện & đồng hồ'}</p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between font-medium">
                    {isDone ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã nhập kho
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Chờ giao nhận
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 font-mono">
                      {b.actualDate ? new Date(b.actualDate).toLocaleDateString('vi-VN') : 'Kế hoạch'}
                    </span>
                  </div>

                  {/* Nút nhập kho trực tiếp liên kết đợt này */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContractId(selectedContract.id);
                      setImportBatchId(b.id);
                      setShowImportModal(true);
                    }}
                    className="w-full mt-2 py-1.5 px-2 rounded-lg bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-brand-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Boxes className="w-3.5 h-3.5 text-brand-600" />
                    Nhập Kho Đợt Này
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Import History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-600" />
                Lịch Sử Phiếu Nhập Kho (Đồng Hồ Mới & Linh Kiện)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh sách các phiếu nhập kho đã thực hiện theo hợp đồng & đợt. Hỗ trợ tra cứu theo năm, xem trước & in Mẫu 01-VT, sửa và xóa.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                Hiển thị {filteredImports.length} / {importList.length} phiếu
              </span>
            </div>
          </div>

          {/* Filter Bar: Year Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="text-slate-500 whitespace-nowrap">Năm xem:</span>
              <select
                value={importYearFilter}
                onChange={(e) => setImportYearFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white shadow-2xs hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="all">Tất cả các năm ({importList.length} phiếu)</option>
                {availableImportYears.map((y) => {
                  const countInYear = importList.filter(
                    (imp) => imp.voucherDate && new Date(imp.voucherDate).getFullYear() === y
                  ).length;
                  return (
                    <option key={y} value={String(y)}>
                      Năm {y} ({countInYear} phiếu)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={importSearchTerm}
                onChange={(e) => setImportSearchTerm(e.target.value)}
                placeholder="Tìm theo số phiếu (PNK-2026...), số HĐ, đợt giao, người giao, mặt hàng..."
                className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder:text-slate-400 font-medium"
              />
              {importSearchTerm && (
                <button
                  type="button"
                  onClick={() => setImportSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {(importYearFilter !== 'all' || importSearchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setImportYearFilter('all');
                  setImportSearchTerm('');
                }}
                className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã Phiếu</th>
                <th className="py-3 px-4">Ngày Nhập</th>
                <th className="py-3 px-4">Hợp Đồng & Đợt</th>
                <th className="py-3 px-4">Mặt Hàng Nhập (ĐH Mới / Linh Kiện)</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredImports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                    Không tìm thấy phiếu nhập kho nào phù hợp với bộ lọc (Năm {importYearFilter === 'all' ? 'tất cả' : importYearFilter}
                    {importSearchTerm ? ` & từ khóa "${importSearchTerm}"` : ''}).
                  </td>
                </tr>
              ) : (
                filteredImports.map((imp) => (
                  <tr key={imp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">{imp.code}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(imp.voucherDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{imp.contract?.contractNumber}</p>
                      <p className="text-[11px] text-slate-500">{imp.batch?.batchName || 'Nhập đợt'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {imp.details?.map((d: any) => {
                          const isMeter = !!d.meterId;
                          const name = isMeter ? d.meter?.name : d.sparePart?.name;
                          return (
                            <span 
                              key={d.id} 
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                isMeter 
                                   ? 'bg-blue-50 border-blue-200 text-blue-800' 
                                   : 'bg-amber-50 border-amber-200 text-amber-800'
                              }`}
                            >
                              {isMeter ? 'ĐH: ' : 'LK: '}{name} (<strong>{d.quantity}</strong>)
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Đã nhập kho
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setPrintModalData({
                              type: 'import',
                              code: imp.code,
                              voucherDate: imp.voucherDate,
                              destinationOrSupplier: imp.contract?.supplierName || 'Nhà cung cấp theo Hợp đồng',
                              customerDeptName: imp.delivererName || imp.customerDeptName || 'Đại diện bên giao hàng',
                              creatorName: imp.receiverName || 'Nguyễn Văn Tiến',
                              workshopManagerName: imp.technicianName || 'Bùi Đức Duy',
                              delivererName: imp.delivererName || imp.customerDeptName || 'Đại diện bên giao hàng',
                              receiverName: imp.receiverName || 'Nguyễn Văn Tiến',
                              technicianName: imp.technicianName || 'Bùi Đức Duy',
                              warehouseName: 'Xưởng đồng hồ',
                              contractNumber: imp.contract?.contractNumber,
                              batchName: imp.batch?.batchName,
                              reason: imp.notes || `Nhập kho theo hợp đồng ${imp.contract?.contractNumber || ''}`,
                              voucherCategory: 'contract_import',
                              items: (imp.details || []).map((d: any, idx: number) => {
                                const isMeter = !!d.meterId;
                                return {
                                  stt: idx + 1,
                                  code: isMeter ? d.meter?.code : d.sparePart?.code,
                                  name: isMeter ? d.meter?.name : d.sparePart?.name,
                                  unit: (isMeter ? d.meter?.unit : d.sparePart?.unit) || 'Cái',
                                  actualQuantity: d.quantity,
                                  statusText: isMeter ? (d.status === 'new' ? 'Mới 100%' : 'Quay vòng') : 'Mới',
                                  notes: d.notes,
                                };
                              }),
                              notes: imp.notes,
                            });
                          }}
                          className="p-1.5 text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded transition-colors"
                          title="Xem trước và In Phiếu Nhập Kho (Mẫu 01-VT)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEditImport(imp)}
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                            title="Chỉnh sửa phiếu nhập kho"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteVoucher(imp.id, imp.code)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa phiếu nhập và trừ tồn kho"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create/Edit Contract */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingContract ? 'Chỉnh Sửa Hợp Đồng' : 'Thêm Hợp Đồng Mua Sắm Mới'}
            </h3>

            <form onSubmit={handleSaveContract} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Hợp Đồng</label>
                  <input
                    type="text"
                    required
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổng Giá Trị (VNĐ)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={totalValue}
                    onChange={(e) => setTotalValue(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu Đề / Gói Thầu</label>
                <input
                  type="text"
                  required
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhà Cung Cấp</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú</label>
                <input
                  type="text"
                  value={contractNotes}
                  onChange={(e) => setContractNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Lưu Hợp Đồng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Batch */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingBatch ? 'Chỉnh Sửa Đợt Giao Hàng' : 'Thêm Đợt Giao Hàng Theo Hợp Đồng'}
            </h3>

            <form onSubmit={handleSaveBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Đợt Giao Hàng</label>
                <input
                  type="text"
                  required
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="VD: Đợt 5 - Cung ứng Tháng 10/2026"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú</label>
                <input
                  type="text"
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Lưu Đợt Giao'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Goods (Both New Meters & Spare Parts) */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-brand-600" />
                  {editingImportVoucher ? `Chỉnh Sửa Phiếu Nhập Kho (${editingImportVoucher.code})` : 'Nhập Kho Linh Kiện & Đồng Hồ Mới Theo Hợp Đồng'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Liên kết chặt chẽ theo hợp đồng và đợt giao nhận. Hỗ trợ nhập thủ công hoặc nạp từ file Excel mẫu.
                </p>
              </div>

              {/* Action Buttons: Download Template & Upload Excel */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/api/contracts/template"
                  download="Mau_Nhap_Kho_Hop_Dong_SOWASUCO.xlsx"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                  title="Tải file Excel mẫu có sẵn 25 loại đồng hồ và 35 linh kiện để điền số lượng"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  Tải Mẫu Excel (.xlsx)
                </a>

                <label className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-brand-600" />
                  <span>Nạp File Excel Đã Điền</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleUploadExcelFile}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleLoadExcelSampleData}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  title="Điền nhanh 7 mặt hàng mẫu thử nghiệm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Mẫu 1-Click
                </button>
              </div>
            </div>

            <form onSubmit={handleImportGoods} className="space-y-4 text-xs">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Linked Contract & Batch Selectors (or Info when editing) */}
              {editingImportVoucher ? (
                <div className="bg-brand-50/70 p-3.5 rounded-xl border border-brand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-700 bg-brand-100/70 px-2 py-0.5 rounded tracking-wider">
                      Đang chỉnh sửa phiếu nhập
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      Mã phiếu: <span className="font-mono text-brand-700">{editingImportVoucher.code}</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Hợp đồng: <strong className="text-slate-800">{editingImportVoucher.contract?.contractNumber}</strong>
                      {editingImportVoucher.batch && (
                        <span> — Đợt: <strong className="text-slate-800">{editingImportVoucher.batch.batchName}</strong></span>
                      )}
                    </p>
                  </div>

                  <div className="w-full sm:w-auto bg-white p-2.5 rounded-lg border border-brand-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-600" />
                      Ngày Lập Phiếu
                    </label>
                    <input
                      type="date"
                      value={editingVoucherDate}
                      onChange={(e) => setEditingVoucherDate(e.target.value)}
                      className="w-full sm:w-44 text-xs border border-slate-300 rounded-md p-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      1. Hợp Đồng Mua Sắm
                    </label>
                    <select
                      value={selectedContractId}
                      onChange={(e) => {
                        const newContractId = Number(e.target.value);
                        setSelectedContractId(newContractId);
                        const targetContract = contracts.find((c) => c.id === newContractId);
                        if (targetContract && targetContract.batches?.length > 0) {
                          setImportBatchId(targetContract.batches[0].id);
                        } else {
                          setImportBatchId(0);
                        }
                      }}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    >
                      {contracts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.contractNumber} - {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      2. Đợt Giao Hàng (Liên kết theo Hợp đồng trên)
                    </label>
                    <select
                      value={importBatchId}
                      onChange={(e) => setImportBatchId(Number(e.target.value))}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    >
                      {selectedContract?.batches && selectedContract.batches.length > 0 ? (
                        selectedContract.batches.map((b: any) => (
                          <option key={b.id} value={b.id}>
                            Đợt {b.batchNumber}: {b.batchName} ({b.status === 'completed' ? 'Đã nhập' : 'Chờ nhập'})
                          </option>
                        ))
                      ) : (
                        <option value={0}>Hợp đồng này chưa có đợt giao nào</option>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* 3 Cán bộ ký phiếu theo quy định: Đại diện người giao hàng, Người lập phiếu, Xưởng đồng hồ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <ParticipantSelect
                  label="Đại Diện Người Giao Hàng"
                  value={customerDeptName}
                  onChange={setCustomerDeptName}
                  options={employees}
                  defaultKey="wm_default_contract_deliverer"
                  defaultFallback="Đại diện bên giao hàng"
                  placeholder="Chọn hoặc nhập người giao hàng"
                  required
                />
                <ParticipantSelect
                  label="Người Lập Phiếu"
                  value={creatorName}
                  onChange={setCreatorName}
                  options={employees}
                  defaultKey="wm_default_contract_creator"
                  defaultFallback="Nguyễn Văn Tiến"
                  placeholder="Chọn người lập phiếu"
                  required
                />
                <ParticipantSelect
                  label="Xưởng Đồng Hồ"
                  value={workshopManagerName}
                  onChange={setWorkshopManagerName}
                  options={employees}
                  defaultKey="wm_default_contract_workshop_manager"
                  defaultFallback="Bùi Đức Duy"
                  placeholder="Chọn đại diện xưởng"
                  required
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-semibold text-slate-700">
                    Danh Sách Mặt Hàng Nhập ({importRows.length} mặt hàng)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Mặt Hàng
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {importRows.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-lg border text-xs">
                      {/* Type Switcher */}
                      <div className="w-28">
                        <select
                          value={row.itemType}
                          onChange={(e) => {
                            const updated = [...importRows];
                            const newType = e.target.value as 'spare_part' | 'meter';
                            updated[idx].itemType = newType;
                            if (newType === 'meter') {
                              updated[idx].itemId = meters[0]?.id || 1;
                              updated[idx].unitPrice = 0;
                            } else {
                              updated[idx].itemId = spareParts[0]?.id || 1;
                              updated[idx].unitPrice = 0;
                            }
                            setImportRows(updated);
                          }}
                          className="w-full text-xs border rounded p-1.5 bg-white font-semibold text-brand-700"
                        >
                          <option value="meter">Đồng hồ mới</option>
                          <option value="spare_part">Linh kiện</option>
                        </select>
                      </div>

                      {/* Product / Part Select */}
                      <div className="flex-1">
                        {row.itemType === 'meter' ? (
                          <select
                            value={row.itemId}
                            onChange={(e) => {
                              const updated = [...importRows];
                              const mId = Number(e.target.value);
                              updated[idx].itemId = mId;
                              setImportRows(updated);
                            }}
                            className="w-full text-xs border rounded p-1.5 bg-white font-medium"
                          >
                            {Array.from(new Set(meters.map(m => m.category || 'Tiêu chuẩn'))).map(cat => (
                              <optgroup key={cat} label={`── ${cat} ──`}>
                                {meters.filter(m => (m.category || 'Tiêu chuẩn') === cat).map((m) => (
                                  <option key={m.id} value={m.id}>
                                    [{m.code}] {m.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={row.itemId}
                            onChange={(e) => {
                              const updated = [...importRows];
                              const spId = Number(e.target.value);
                              updated[idx].itemId = spId;
                              setImportRows(updated);
                            }}
                            className="w-full text-xs border rounded p-1.5 bg-white font-medium"
                          >
                            {Array.from(new Set(spareParts.map(sp => sp.category || 'Linh kiện'))).map(cat => (
                              <optgroup key={cat} label={`── ${cat} ──`}>
                                {spareParts.filter(sp => (sp.category || 'Linh kiện') === cat).map((sp) => (
                                  <option key={sp.id} value={sp.id}>
                                    [{sp.code}] {sp.name} (Tồn: {sp.currentStock})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="w-28">
                        <input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => {
                            const updated = [...importRows];
                            updated[idx].quantity = Number(e.target.value);
                            setImportRows(updated);
                          }}
                          placeholder="Số lượng"
                          className="w-full text-xs border rounded p-1.5 text-right font-bold text-slate-800"
                          required
                        />
                      </div>

                      {/* Delete Row */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú Phiếu Nhập</label>
                <input
                  type="text"
                  value={importNotes}
                  onChange={(e) => setImportNotes(e.target.value)}
                  placeholder="VD: Nhập kho theo biên bản giao nhận số..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div className="text-xs">
                  <span className="text-slate-500">Tổng số lượng nhập: </span>
                  <span className="font-bold font-mono text-sm text-brand-700">
                    {importRows.reduce((acc, r) => acc + (r.quantity || 0), 0).toLocaleString()} cái/chi tiết
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setEditingImportVoucher(null);
                    }}
                    className="px-4 py-2 rounded-lg border text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-500 disabled:opacity-50"
                  >
                    {loading ? 'Đang xử lý...' : (editingImportVoucher ? 'Lưu Thay Đổi Phiếu Nhập' : 'Xác Nhận Nhập Kho')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal In & Xem trước Phiếu Nhập Kho (Mẫu 01-VT) */}
      {printModalData && (
        <PrintVoucherModal
          data={printModalData}
          onClose={() => setPrintModalData(null)}
        />
      )}
    </div>
  );
}
