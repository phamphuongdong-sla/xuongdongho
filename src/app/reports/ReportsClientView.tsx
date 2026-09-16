'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  Boxes, 
  Building2, 
  CheckCircle2, 
  Calendar, 
  Truck, 
  LayoutGrid, 
  Table2, 
  LineChart,
  Eye,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  History,
  PackageCheck,
  Layers,
  Edit2,
  Save,
  X,
  RotateCcw,
  Send,
  Wrench,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { updateOpeningStock } from '@/actions/reports';
import { ParticipantSelect } from '@/components/vouchers/ParticipantSelect';
import type { SessionUser } from '@/types';
import {
  extractMeterDN,
  DN_ORDER_MAP,
  STANDARD_UNIT_KEYS,
  mapUnitToStandardKey,
  MONTHS_LIST,
  isRepairedMeter,
} from '@/services/reports.service';

export function ReportsClientView({
  metersOracle,
  sparePartsOracle,
  availableYears = [2025, 2026, 2027, 2028, 2029, 2030],
  yearlyData = {},
  unitSummaries,
  currentUser,
  allExportVouchers = [],
  unitsList = [],
  employees = [],
}: {
  metersOracle: any[];
  sparePartsOracle: any[];
  availableYears?: number[];
  yearlyData?: Record<number, any>;
  unitSummaries: any[];
  currentUser?: SessionUser | null;
  allExportVouchers?: any[];
  unitsList?: any[];
  employees?: any[];
}) {
  const isAdmin = currentUser ? currentUser.role === 'admin' : true;
  const [activeTab, setActiveTab] = useState<'meters' | 'parts' | 'monthlyWorkshop'>('meters');

  // Signatories for Monthly Export Report
  const [reportCreator, setReportCreator] = useState<string>('Đồng Đức Anh');
  const [reportDeptManager, setReportDeptManager] = useState<string>('Phạm Phương Đông');

  // Presentation Mode Switcher
  const [displayMode, setDisplayMode] = useState<'matrix' | 'cards' | 'timeline'>('matrix');

  // Filters for monthly export report (default to current month and year)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = `Tháng ${now.getMonth() + 1}`;
  const defaultYear = availableYears.includes(currentYear)
    ? currentYear
    : (availableYears[availableYears.length - 1] || currentYear);

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr); // Default to current month
  const [meterTypeFilter, setMeterTypeFilter] = useState<'all' | 'new' | 'circ'>('all'); // All, Only New, Only Repaired
  const [selectedProductCode, setSelectedProductCode] = useState<string>('ĐH015'); // For Timeline view
  const [fitMode, setFitMode] = useState<boolean>(true); // Co dãn vừa khung màn hình để xem tổng quan
  const [expandedPartStt, setExpandedPartStt] = useState<number | null>(null);
  const [expandedMeterCode, setExpandedMeterCode] = useState<string | null>(null);

  // Filters for Workshop Monthly Export Report (Mẫu Xưởng)
  const [workshopYear, setWorkshopYear] = useState<number>(defaultYear);
  const [workshopMonth, setWorkshopMonth] = useState<string>(currentMonthStr);
  const [onlyActiveColumns, setOnlyActiveColumns] = useState<boolean>(true);

  // Inline Opening Stock Editing States
  const [editingMeterKey, setEditingMeterKey] = useState<string | null>(null);
  const [editingMeterValue, setEditingMeterValue] = useState<number>(0);
  const [editingPartKey, setEditingPartKey] = useState<string | null>(null);
  const [editingPartValue, setEditingPartValue] = useState<number>(0);
  const [savingOpening, setSavingOpening] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Client-side local overrides for instant reactivity
  const [localMeterOverrides, setLocalMeterOverrides] = useState<Record<string, Record<string, number>>>({});
  const [localPartOverrides, setLocalPartOverrides] = useState<Record<string, Record<string, number>>>({});

  const handleSaveMeterOpening = async (code: string) => {
    setSavingOpening(true);
    setSaveMessage(null);
    try {
      await updateOpeningStock({
        year: selectedYear,
        type: 'meter',
        identifier: code,
        opening: editingMeterValue,
      });
      setLocalMeterOverrides((prev) => ({
        ...prev,
        [String(selectedYear)]: {
          ...(prev[String(selectedYear)] || {}),
          [code]: editingMeterValue,
        },
      }));
      setEditingMeterKey(null);
      setSaveMessage({ type: 'success', text: `Đã cập nhật tồn đầu kỳ cho đồng hồ ${code} thành ${editingMeterValue.toLocaleString()} cái.` });
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Lỗi khi lưu tồn đầu kỳ đồng hồ' });
    } finally {
      setSavingOpening(false);
    }
  };

  const handleSavePartOpening = async (name: string) => {
    setSavingOpening(true);
    setSaveMessage(null);
    try {
      await updateOpeningStock({
        year: selectedYear,
        type: 'part',
        identifier: name,
        opening: editingPartValue,
      });
      setLocalPartOverrides((prev) => ({
        ...prev,
        [String(selectedYear)]: {
          ...(prev[String(selectedYear)] || {}),
          [name]: editingPartValue,
        },
      }));
      setEditingPartKey(null);
      setSaveMessage({ type: 'success', text: `Đã cập nhật tồn đầu kỳ cho linh kiện ${name} thành ${editingPartValue.toLocaleString()} cái.` });
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Lỗi khi lưu tồn đầu kỳ linh kiện' });
    } finally {
      setSavingOpening(false);
    }
  };

  // Dữ liệu theo năm được chọn (hoặc mặc định năm 2026)
  const currentYearData = yearlyData[selectedYear] || yearlyData[2026] || {
    months: [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ],
    units: {},
    products: [],
  };

  const monthsList: string[] = currentYearData.months || [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const unitsEntries = Object.entries(currentYearData.units || {});

  // Mapping viết tắt 12 đơn vị (Bắc Yên = BY, Mộc Châu = MC, TP1, TP2, Mai Sơn = MS, v.v.)
  const getUnitAbbr = (key: string, name: string): string => {
    if (key === 'BY' || name.includes('Bắc Yên')) return 'BY';
    if (key === 'MC + Vân hồ' || key === 'MC' || name.includes('Mộc Châu')) return 'MC';
    if (key === 'TP1' || name.includes('TP 1') || name.includes('TP1') || name.includes('số 1') || name.includes('Số 1')) return 'TP1';
    if (key === 'TP2' || name.includes('TP 2') || name.includes('TP2') || name.includes('số 2') || name.includes('Số 2')) return 'TP2';
    if (key === 'MS' || name.includes('Mai Sơn')) return 'MS';
    if (key === 'YC' || name.includes('Yên Châu')) return 'YC';
    if (key === 'TC' || name.includes('Thuận Châu')) return 'TC';
    if (key === 'PY' || name.includes('Phù Yên')) return 'PY';
    if (key === 'ML' || name.includes('Mường La')) return 'ML';
    if (key === 'SM' || name.includes('Sông Mã')) return 'SM';
    if (key === 'SC' || name.includes('Sốp Cộp')) return 'SC';
    if (key === 'QN' || name.includes('Quỳnh Nhai')) return 'QN';
    return key;
  };

  // 12 Đơn vị với mã viết tắt và tên đầy đủ
  const unitHeaders = unitsEntries.map(([key, val]: [string, any]) => {
    const fullName = val.unitName || key;
    const abbr = getUnitAbbr(key, fullName);
    return {
      key,
      abbr,
      shortName: abbr,
      fullName,
      meters: val.meters || [],
    };
  });

  // Unique list of products across units for the selected year
  const productsList: any[] = currentYearData.products || [];

  // Tính tổng theo từng cột đơn vị cho hàng Footer (Tổng Đơn Vị)
  const colTotals = unitHeaders.map((u) => {
    let uNew = 0;
    let uCirc = 0;
    productsList.forEach((prod) => {
      const uMeter = u.meters.find((m: any) => m.code === prod.code || m.name === prod.name);
      if (uMeter) {
        if (selectedMonth === 'all') {
          uNew += uMeter.year_total?.new || 0;
          uCirc += uMeter.year_total?.circ || 0;
        } else {
          const mData = uMeter.months?.[selectedMonth];
          uNew += mData?.new || 0;
          uCirc += mData?.circ || 0;
        }
      }
    });
    let total = 0;
    if (meterTypeFilter === 'all') total = uNew + uCirc;
    else if (meterTypeFilter === 'new') total = uNew;
    else if (meterTypeFilter === 'circ') total = uCirc;
    return { uNew, uCirc, total };
  });

  const grandTotal = colTotals.reduce((sum, c) => sum + c.total, 0);
  const grandTotalNew = colTotals.reduce((sum, c) => sum + c.uNew, 0);
  const grandTotalCirc = colTotals.reduce((sum, c) => sum + c.uCirc, 0);

  // Used meters matrix variables (Báo cáo ĐH cũ về xưởng)
  const usedUnitsEntries = Object.entries(currentYearData.usedMetersUnits || currentYearData.units || {});
  const usedUnitHeaders = usedUnitsEntries.map(([key, val]: [string, any]) => {
    const fullName = val.unitName || key;
    const abbr = getUnitAbbr(key, fullName);
    return {
      key,
      abbr,
      shortName: abbr,
      fullName,
      meters: val.meters || [],
    };
  });
  const usedProductsList: any[] = currentYearData.usedMetersProducts || productsList;
  const usedMetersSummary: any[] = currentYearData.usedMetersSummary || [];

  const usedColTotals = usedUnitHeaders.map((u) => {
    let total = 0;
    usedProductsList.forEach((prod) => {
      const uMeter = u.meters.find((m: any) => m.code === prod.code || m.name === prod.name);
      if (uMeter) {
        if (selectedMonth === 'all') {
          total += uMeter.year_total?.total || 0;
        } else {
          const mData = uMeter.months?.[selectedMonth];
          total += mData?.total || 0;
        }
      }
    });
    return total;
  });

  const grandTotalUsedReceived = usedColTotals.reduce((sum, c) => sum + c, 0);
  const grandTotalRepaired = usedMetersSummary.reduce((sum, item) => sum + (item.totalRepaired || 0), 0);
  const grandTotalScrapped = usedMetersSummary.reduce((sum, item) => sum + (item.totalScrapped || 0), 0);
  const grandTotalWaitingRepair = usedMetersSummary.reduce((sum, item) => sum + (item.endingWaitingRepair || 0), 0);

  // Data calculation for Workshop Monthly Export Report (Mẫu Xưởng)
  const workshopMonthNum = MONTHS_LIST.indexOf(workshopMonth) + 1;
  const currentWorkshopUnitData = yearlyData[workshopYear]?.units || {};

  const workshopUnitRows = STANDARD_UNIT_KEYS.map((std, idx) => {
    const unitYearData = currentWorkshopUnitData[std.key];
    const repairedQuantities: Record<string, number> = {};
    const newQuantities: Record<string, number> = {};

    if (unitYearData?.meters) {
      for (const m of unitYearData.meters) {
        const mMonth = m.months?.[workshopMonth];
        if (mMonth) {
          const dn = extractMeterDN(m.code, m.name);
          const isMeterRep = isRepairedMeter(m);

          if (isMeterRep) {
            // For repaired meters (e.g. ĐH015(SC)), all export quantities belong to repaired group
            const qty = (mMonth.circ || 0) + (mMonth.new || 0);
            if (qty > 0) {
              repairedQuantities[dn] = (repairedQuantities[dn] || 0) + qty;
            }
          } else {
            // For regular/new meters, circ belongs to repaired group, new belongs to new group
            if (mMonth.circ > 0) {
              repairedQuantities[dn] = (repairedQuantities[dn] || 0) + mMonth.circ;
            }
            if (mMonth.new > 0) {
              newQuantities[dn] = (newQuantities[dn] || 0) + mMonth.new;
            }
          }
        }
      }
    }

    // Also get notes from export vouchers for this unit in this month
    const unitNotes = (allExportVouchers || [])
      .filter((v: any) => {
        const d = new Date(v.voucherDate);
        return (
          d.getFullYear() === workshopYear &&
          d.getMonth() + 1 === workshopMonthNum &&
          mapUnitToStandardKey(v.destinationUnit?.code, v.destinationUnit?.name) === std.key &&
          v.notes
        );
      })
      .map((v: any) => v.notes.trim())
      .filter((note: string, i: number, arr: string[]) => note && arr.indexOf(note) === i);

    const subtotalRepaired = Object.values(repairedQuantities).reduce((a, b) => a + b, 0);
    const subtotalNew = Object.values(newQuantities).reduce((a, b) => a + b, 0);
    const grandTotal = subtotalRepaired + subtotalNew;

    return {
      stt: idx + 1,
      unitKey: std.key,
      unitName: std.name,
      repairedQuantities,
      newQuantities,
      subtotalRepaired,
      subtotalNew,
      grandTotal,
      notes: unitNotes.join('; '),
    };
  });

  const totalRepairedByDN: Record<string, number> = {};
  const totalNewByDN: Record<string, number> = {};

  workshopUnitRows.forEach((row) => {
    Object.entries(row.repairedQuantities).forEach(([dn, qty]) => {
      totalRepairedByDN[dn] = (totalRepairedByDN[dn] || 0) + qty;
    });
    Object.entries(row.newQuantities).forEach(([dn, qty]) => {
      totalNewByDN[dn] = (totalNewByDN[dn] || 0) + qty;
    });
  });

  const sortDNs = (dns: string[]) => {
    return [...dns].sort((a, b) => (DN_ORDER_MAP[a] || 999) - (DN_ORDER_MAP[b] || 999));
  };

  let workshopRepairedDNs: string[];
  let workshopNewDNs: string[];

  if (onlyActiveColumns) {
    const actRep = Object.keys(totalRepairedByDN).filter((dn) => (totalRepairedByDN[dn] || 0) > 0);
    const actNew = Object.keys(totalNewByDN).filter((dn) => (totalNewByDN[dn] || 0) > 0);

    workshopRepairedDNs = sortDNs(actRep);
    workshopNewDNs = sortDNs(actNew);
  } else {
    workshopRepairedDNs = ['DN15', 'DN20', 'DN25', 'DN32', 'DN40', 'DN50'];
    workshopNewDNs = ['DN15', 'DN20', 'DN25', 'DN32', 'DN40', 'DN50', 'DN80', 'DN150', 'DN200'];
  }

  const grandWorkshopRepaired = workshopUnitRows.reduce((sum, r) => sum + r.subtotalRepaired, 0);
  const grandWorkshopNew = workshopUnitRows.reduce((sum, r) => sum + r.subtotalNew, 0);
  const grandWorkshopTotal = grandWorkshopRepaired + grandWorkshopNew;

  return (
    <div className="space-y-6">
      {/* Print media landscape and clean styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          nav, header, aside, footer {
            display: none !important;
          }
          body {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `,
        }}
      />

      {/* Top Main Navigation Tabs */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 shadow-sm print:hidden">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('meters')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'meters'
                ? 'bg-white text-blue-700 shadow-sm border border-blue-200/80 ring-1 ring-blue-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Table2 className={`w-4 h-4 ${activeTab === 'meters' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Kho Đồng Hồ</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
              activeTab === 'meters' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/70 text-slate-500'
            }`}>
              Kho ĐH
            </span>
          </button>

          <button
            onClick={() => setActiveTab('parts')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'parts'
                ? 'bg-white text-purple-700 shadow-sm border border-purple-200/80 ring-1 ring-purple-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Boxes className={`w-4 h-4 ${activeTab === 'parts' ? 'text-purple-600' : 'text-slate-400'}`} />
            <span>Kho Linh Kiện</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
              activeTab === 'parts' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200/70 text-slate-500'
            }`}>
              Kho LK
            </span>
          </button>

          <button
            onClick={() => setActiveTab('monthlyWorkshop')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'monthlyWorkshop'
                ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200/80 ring-1 ring-emerald-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'monthlyWorkshop' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>3. Báo Cáo Xuất ĐH Theo Tháng</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
              activeTab === 'monthlyWorkshop' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/70 text-slate-500'
            }`}>
              Theo Tháng
            </span>
          </button>
        </div>

        <Link
          href="/unit-reports"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200/60 rounded-lg transition-colors"
          title="Chuyển sang Báo cáo Nhập Xuất 12 Đơn Vị"
        >
          <Building2 className="w-3.5 h-3.5 text-brand-600" />
          <span>Báo Cáo 12 Đơn Vị</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Save Message Notification */}
      {saveMessage && (
        <div 
          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
            saveMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSaveMessage(null)}
            className="p-1 hover:bg-black/5 rounded text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB: BÁO CÁO XUẤT ĐH THEO THÁNG */}
      {activeTab === 'monthlyWorkshop' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4 print:hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Year Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Năm:</span>
                  <select
                    value={workshopYear}
                    onChange={(e) => setWorkshopYear(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-sm font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        Năm {yr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Tháng:</span>
                  <select
                    value={workshopMonth}
                    onChange={(e) => setWorkshopMonth(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-sm font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  >
                    {MONTHS_LIST.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Columns Filter Toggle */}
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={onlyActiveColumns}
                    onChange={(e) => setOnlyActiveColumns(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                  <span>Chỉ hiện cột đồng hồ đã xuất</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                    {workshopRepairedDNs.length + workshopNewDNs.length} cỡ DN
                  </span>
                </label>
              </div>

              {/* Action Buttons: Xuất Excel & In / Xuất PDF */}
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`/api/export-monthly-unit-report?year=${workshopYear}&month=${workshopMonthNum}&onlyActive=${onlyActiveColumns}&creatorName=${encodeURIComponent(reportCreator)}&deptManagerName=${encodeURIComponent(reportDeptManager)}`}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
                  title="Tải bảng tính Excel định dạng chuẩn mẫu Xưởng có sẵn công thức và chữ ký cán bộ"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Xuất Excel Chuẩn Mẫu</span>
                </a>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
                  title="In báo cáo A4 ngang hoặc lưu thành tệp PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>In / Xuất PDF</span>
                </button>
              </div>
            </div>

            {/* Chọn Cán Bộ Ký Báo Cáo (Người lập & Trưởng phòng) */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
              <ParticipantSelect
                label="Người Lập Báo Cáo"
                value={reportCreator}
                onChange={setReportCreator}
                options={employees}
                defaultKey="wm_default_report_creator"
                defaultFallback="Đồng Đức Anh"
                placeholder="Chọn hoặc nhập người lập báo cáo"
                required
              />
              <ParticipantSelect
                label="Trưởng Phòng Duyệt"
                value={reportDeptManager}
                onChange={setReportDeptManager}
                options={employees}
                defaultKey="wm_default_report_dept_manager"
                defaultFallback="Phạm Phương Đông"
                placeholder="Chọn hoặc nhập trưởng phòng duyệt"
                required
              />
            </div>

            {/* Note banner */}
            <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Đang hiển thị dữ liệu xuất kho cho <strong>12 đơn vị</strong> trong <strong>{workshopMonth}-{workshopYear}</strong>. 
                {onlyActiveColumns ? ' Các cột không có số xuất đã được tự động ẩn.' : ' Đang hiển thị toàn bộ các cột mẫu chuẩn.'}
              </span>
              <span className="text-slate-400 italic">Mẫu chuẩn theo dõi xuất xưởng SOWASUCO</span>
            </div>
          </div>

          {/* Paper Report Preview (Matches media_1789093405589.png) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print:p-0 print:border-none print:shadow-none print:rounded-none overflow-x-auto">
            <div className="min-w-[960px] text-slate-900 font-sans print:font-serif">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs uppercase font-medium tracking-wide">Công ty cổ phần cấp nước Sơn La</p>
                  <p className="text-xs font-bold uppercase tracking-wide">XƯỞNG ĐỒNG HỒ</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-slate-900">
                  SỐ LƯỢNG ĐỒNG HỒ ĐÃ XUẤT {workshopMonth.toUpperCase()}-{workshopYear}
                </h2>
              </div>

              {/* Table */}
              <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                <thead>
                  <tr className="bg-slate-100/80 font-bold">
                    <th rowSpan={2} className="border border-slate-400 px-2 py-2 w-12">
                      STT
                    </th>
                    <th rowSpan={2} className="border border-slate-400 px-3 py-2 text-left min-w-[170px]">
                      TÊN ĐƠN VỊ
                    </th>
                    <th colSpan={workshopRepairedDNs.length + 1} className="border border-slate-400 px-2 py-1.5 bg-amber-50/70 text-amber-900">
                      ĐỒNG HỒ SỬA CHỮA
                    </th>
                    <th colSpan={workshopNewDNs.length + 1} className="border border-slate-400 px-2 py-1.5 bg-blue-50/70 text-blue-900">
                      ĐỒNG HỒ MỚI
                    </th>
                    <th rowSpan={2} className="border border-slate-400 px-3 py-2 min-w-[70px] bg-slate-200/60 font-extrabold">
                      TỔNG CỘNG
                    </th>
                    <th rowSpan={2} className="border border-slate-400 px-3 py-2 min-w-[120px] text-left">
                      GHI CHÚ
                    </th>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    {/* Subheaders for Repaired */}
                    {workshopRepairedDNs.map((dn) => (
                      <th key={`sc-${dn}`} className="border border-slate-400 px-2 py-1 min-w-[45px] bg-amber-50/40">
                        {dn}
                      </th>
                    ))}
                    <th className="border border-slate-400 px-2 py-1 min-w-[55px] bg-amber-100/60 font-extrabold text-amber-950">
                      Cộng
                    </th>

                    {/* Subheaders for New */}
                    {workshopNewDNs.map((dn) => (
                      <th key={`new-${dn}`} className="border border-slate-400 px-2 py-1 min-w-[45px] bg-blue-50/40">
                        {dn}
                      </th>
                    ))}
                    <th className="border border-slate-400 px-2 py-1 min-w-[55px] bg-blue-100/60 font-extrabold text-blue-950">
                      Cộng
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {workshopUnitRows.map((row) => (
                    <tr key={row.unitKey} className="hover:bg-slate-50/80 transition-colors">
                      <td className="border border-slate-400 px-2 py-1.5 font-medium text-slate-600">
                        {row.stt}
                      </td>
                      <td className="border border-slate-400 px-3 py-1.5 text-left font-bold text-slate-800">
                        {row.unitName}
                      </td>

                      {/* Repaired values */}
                      {workshopRepairedDNs.map((dn) => {
                        const val = row.repairedQuantities[dn];
                        return (
                          <td key={`sc-${row.unitKey}-${dn}`} className="border border-slate-400 px-2 py-1.5 font-semibold text-slate-700">
                            {val ? val.toLocaleString() : '-'}
                          </td>
                        );
                      })}
                      <td className="border border-slate-400 px-2 py-1.5 font-bold text-amber-900 bg-amber-50/40">
                        {row.subtotalRepaired ? row.subtotalRepaired.toLocaleString() : '-'}
                      </td>

                      {/* New values */}
                      {workshopNewDNs.map((dn) => {
                        const val = row.newQuantities[dn];
                        return (
                          <td key={`new-${row.unitKey}-${dn}`} className="border border-slate-400 px-2 py-1.5 font-semibold text-slate-700">
                            {val ? val.toLocaleString() : '-'}
                          </td>
                        );
                      })}
                      <td className="border border-slate-400 px-2 py-1.5 font-bold text-blue-900 bg-blue-50/40">
                        {row.subtotalNew ? row.subtotalNew.toLocaleString() : '-'}
                      </td>

                      {/* Grand Total */}
                      <td className="border border-slate-400 px-2 py-1.5 font-extrabold text-slate-900 bg-slate-100">
                        {row.grandTotal ? row.grandTotal.toLocaleString() : '-'}
                      </td>

                      {/* Notes */}
                      <td className="border border-slate-400 px-3 py-1.5 text-left text-[11px] text-slate-500 italic">
                        {row.notes || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Total Row */}
                <tfoot>
                  <tr className="bg-slate-200/80 font-extrabold text-slate-900">
                    <td colSpan={2} className="border border-slate-400 px-3 py-2 text-center uppercase tracking-wider">
                      CỘNG
                    </td>

                    {/* Repaired Column Sums */}
                    {workshopRepairedDNs.map((dn) => (
                      <td key={`sc-sum-${dn}`} className="border border-slate-400 px-2 py-2">
                        {(totalRepairedByDN[dn] || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="border border-slate-400 px-2 py-2 bg-amber-200/70 text-amber-950 font-black">
                      {grandWorkshopRepaired.toLocaleString()}
                    </td>

                    {/* New Column Sums */}
                    {workshopNewDNs.map((dn) => (
                      <td key={`new-sum-${dn}`} className="border border-slate-400 px-2 py-2">
                        {(totalNewByDN[dn] || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="border border-slate-400 px-2 py-2 bg-blue-200/70 text-blue-950 font-black">
                      {grandWorkshopNew.toLocaleString()}
                    </td>

                    {/* Grand Total Sum */}
                    <td className="border border-slate-400 px-2 py-2 bg-emerald-100 text-emerald-950 font-black text-sm">
                      {grandWorkshopTotal.toLocaleString()}
                    </td>

                    {/* Empty Notes Cell */}
                    <td className="border border-slate-400 px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures Block */}
              <div className="mt-12 grid grid-cols-2 text-center text-xs text-slate-800 break-inside-avoid">
                {/* Left: Người lập biểu */}
                <div className="space-y-1">
                  <p className="font-bold uppercase text-sm">Người lập biểu</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-20 flex items-end justify-center">
                    <p className="font-bold text-sm text-slate-900">{reportCreator || 'Đồng Đức Anh'}</p>
                  </div>
                </div>

                {/* Right: Trưởng phòng / Phụ trách */}
                <div className="space-y-1">
                  <p className="italic text-slate-600 mb-1">
                    Sơn La, {workshopMonth.toLowerCase()} năm {workshopYear}
                  </p>
                  <p className="font-bold uppercase text-sm">Trưởng phòng</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-20 flex items-end justify-center">
                    <p className="font-bold text-sm text-slate-900">{reportDeptManager || 'Phạm Phương Đông'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ĐỐI SOÁT ĐỒNG HỒ */}
      {activeTab === 'meters' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div>
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-brand-600" />
                Kho Đồng Hồ — Nhập / Xuất / Tồn Năm {selectedYear}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tổng hợp toàn bộ biến động tồn kho đồng hồ: mọi phiếu nhập kho (hợp đồng mua sắm, trả về xưởng, bổ sung), phiếu xuất cấp 12 đơn vị và xuất bổ sung đều được tính vào kho theo từng loại đồng hồ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Năm:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-bold text-brand-700 text-xs shadow-2xs"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>Năm {yr}</option>
                ))}
              </select>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Cân Đối Chuẩn
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 min-w-[90px]">Mã Hàng</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Tên Hàng / Chủng Loại</th>
                  <th className="py-2.5 px-2 text-center w-14">ĐVT</th>
                  <th className="py-2.5 px-3 text-right min-w-[80px]">Đầu Kỳ</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700 min-w-[90px]">Tổng Nhập</th>
                  <th className="py-2.5 px-4 min-w-[220px]">Các Đợt / Lần Nhập Kho</th>
                  <th className="py-2.5 px-3 text-right text-amber-700 min-w-[85px]">Tổng Xuất</th>
                  <th className="py-2.5 px-3 text-right font-bold text-brand-900 min-w-[90px] bg-brand-50/40">Cuối Kỳ</th>
                  <th className="py-2.5 px-2 text-center w-16">Kiểm Tra</th>
                  <th className="py-2.5 px-2 text-center w-14">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(currentYearData.metersBalance || metersOracle).map((m: any, idx: number) => {
                  const effectiveOpening = localMeterOverrides[String(selectedYear)]?.[m.code] !== undefined
                    ? localMeterOverrides[String(selectedYear)][m.code]
                    : (m.opening || 0);
                  const effectiveEnding = effectiveOpening + (m.import || 0) - (m.export || 0);
                  const isMatch = (effectiveOpening + m.import - m.export) === effectiveEnding;
                  const isExpanded = expandedMeterCode === m.code;
                  const records: any[] = m.importRecords || [];
                  const exportRecords: any[] = m.exportRecords || [];
                  const hasRecords = records.length > 0;
                  const hasExportRecords = exportRecords.length > 0;
                  const isEditingThis = editingMeterKey === m.code;

                  return (
                    <React.Fragment key={m.code || idx}>
                      <tr 
                        className={`transition-colors ${
                          isExpanded ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td 
                          onClick={() => setExpandedMeterCode(isExpanded ? null : m.code)}
                          className="py-2.5 px-3 font-mono font-bold text-brand-700 cursor-pointer"
                        >
                          {m.code}
                        </td>
                        <td 
                          onClick={() => setExpandedMeterCode(isExpanded ? null : m.code)}
                          className="py-2.5 px-4 font-semibold text-slate-900 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{m.name}</span>
                            {m.category && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                m.category === 'Sửa chữa' || m.code?.includes('(SC)')
                                  ? 'bg-amber-100 text-amber-800'
                                  : m.category === 'Ngoại nhập'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {m.category}
                              </span>
                            )}
                            {hasRecords && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                +{records.length} lần nhập
                              </span>
                            )}
                            {hasExportRecords && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                -{exportRecords.length} lần xuất
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-500 font-medium">
                          {m.unit}
                        </td>

                        {/* Cột Đầu Kỳ có thể chỉnh sửa trực tiếp */}
                        <td className="py-2 px-2 text-right">
                          {isEditingThis ? (
                            <div className="inline-flex items-center gap-1 bg-white border-2 border-brand-500 rounded-lg p-1 shadow-md z-20">
                              <input
                                type="number"
                                min={0}
                                value={editingMeterValue}
                                onChange={(e) => setEditingMeterValue(Number(e.target.value))}
                                className="w-20 text-right font-mono text-xs font-bold px-1.5 py-0.5 border border-slate-200 rounded focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveMeterOpening(m.code)}
                                disabled={savingOpening}
                                className="p-1 bg-brand-600 hover:bg-brand-500 text-white rounded text-[11px]"
                                title="Lưu tồn đầu kỳ"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingMeterKey(null)}
                                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px]"
                                title="Hủy"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isAdmin ? (
                            <div 
                              onClick={() => {
                                setEditingMeterKey(m.code);
                                setEditingMeterValue(effectiveOpening);
                              }}
                              className="group inline-flex items-center justify-end gap-1 cursor-pointer py-1 px-1.5 rounded hover:bg-brand-50 transition-colors"
                              title="Bấm để sửa Tồn Đầu Kỳ"
                            >
                              <span className="font-mono text-slate-700 font-semibold group-hover:text-brand-700">
                                {effectiveOpening.toLocaleString()}
                              </span>
                              <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ) : (
                            <span className="font-mono text-slate-700 font-semibold py-1 px-1.5">
                              {effectiveOpening.toLocaleString()}
                            </span>
                          )}

                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold bg-emerald-50/30">
                          {m.import.toLocaleString()}
                        </td>

                        {/* Cột Chi Tiết Các Đợt Nhập */}
                        <td className="py-2 px-4">
                          {hasRecords ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {records.slice(0, 2).map((rec: any, rIdx: number) => (
                                <span 
                                  key={rIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold"
                                  title={`${rec.voucherCode} (${rec.voucherDate}): +${rec.quantity.toLocaleString()} ${m.unit}`}
                                >
                                  <span className="font-mono text-emerald-700">{rec.batchName || rec.voucherCode}:</span>
                                  <span className="font-bold">+{rec.quantity.toLocaleString()}</span>
                                </span>
                              ))}
                              {records.length > 2 && (
                                <span className="text-[10px] text-slate-500 font-bold">
                                  +{records.length - 2} đợt khác...
                                </span>
                              )}
                            </div>
                          ) : (m.import > 0 ? (
                            <span className="text-[11px] text-slate-400 italic">
                              Nhập phân bổ gốc ({m.import.toLocaleString()} {m.unit})
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          ))}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-semibold">
                          {m.export.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-brand-900 bg-brand-50/30">
                          {effectiveEnding.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          {isMatch ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Khớp
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              Lệch
                            </span>
                          )}
                        </td>

                        <td 
                          className="py-2.5 px-2 text-center cursor-pointer"
                          onClick={() => setExpandedMeterCode(isExpanded ? null : m.code)}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedMeterCode(isExpanded ? null : m.code);
                            }}
                            className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                            title={isExpanded ? "Đóng sổ chi tiết" : "Mở sổ chi tiết Nhập - Xuất - Tồn"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-brand-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable row: Sổ chi tiết từng lần nhập & xuất kho đồng hồ */}
                      {isExpanded && (
                        <tr className="bg-slate-50/95 border-y border-amber-200">
                          <td colSpan={10} className="p-4 sm:p-5">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-5">
                              {/* Header sổ chi tiết */}
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                                    <PackageCheck className="w-5 h-5 text-brand-600" />
                                    Sổ Chi Tiết Nhập - Xuất - Tồn Đồng Hồ: [{m.code}] {m.name}
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Đơn vị tính: <strong>{m.unit}</strong> • Năm theo dõi: <strong>{selectedYear}</strong> • Công thức cân đối: Tồn Cuối ({effectiveEnding.toLocaleString()}) = Tồn Đầu ({effectiveOpening.toLocaleString()}) + Tổng Nhập ({m.import.toLocaleString()}) - Tổng Xuất ({m.export.toLocaleString()})
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="text-slate-500">Đầu Kỳ:</span> <strong className="font-mono text-slate-800">{effectiveOpening.toLocaleString()}</strong>
                                  </div>
                                  <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                                    <span>Tổng Nhập:</span> <strong className="font-mono font-bold">+{m.import.toLocaleString()}</strong>
                                  </div>
                                  <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                                    <span>Tổng Xuất:</span> <strong className="font-mono font-bold">-{m.export.toLocaleString()}</strong>
                                  </div>
                                  <div className="px-2.5 py-1 bg-brand-50 border border-brand-200 rounded-lg text-brand-900 font-bold">
                                    <span>Cuối Kỳ:</span> <strong className="font-mono">{effectiveEnding.toLocaleString()}</strong> {m.unit}
                                  </div>
                                </div>
                              </div>

                              {/* BẢNG 1: LỊCH SỬ CÁC LẦN NHẬP KHO */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                                    1. Lịch Sử Các Đợt / Phiếu Nhập Kho ({records.length} lần phát sinh)
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    Cộng dồn từ: Hợp đồng mua sắm mới, Xưởng sửa hoàn tất, Nhập chuyển đổi bổ sung
                                  </span>
                                </div>

                                {hasRecords ? (
                                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-emerald-50/70 text-emerald-900 font-semibold border-b border-emerald-100 text-[11px]">
                                        <tr>
                                          <th className="py-2 px-3">Mã Phiếu Nhập</th>
                                          <th className="py-2 px-3">Ngày Nhập</th>
                                          <th className="py-2 px-3">Lý Do / Nguồn Nhập</th>
                                          <th className="py-2 px-3">Hợp Đồng / Đợt Giao Hàng</th>
                                          <th className="py-2 px-3">Tình Trạng</th>
                                          <th className="py-2 px-3 text-right">Số Lượng Nhập</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-sans">
                                        {records.map((rec, rIdx) => (
                                          <tr key={rIdx} className="hover:bg-emerald-50/40">
                                            <td className="py-2 px-3 font-mono font-bold text-brand-700">{rec.voucherCode}</td>
                                            <td className="py-2 px-3 text-slate-700 font-mono">{rec.voucherDate || '-'}</td>
                                            <td className="py-2 px-3 text-slate-800 font-medium">
                                              {rec.importReason || 'Nhập kho theo kế hoạch'}
                                            </td>
                                            <td className="py-2 px-3 text-emerald-800 font-medium">
                                              {rec.contractNumber ? `${rec.contractNumber} (${rec.batchName || ''})` : (rec.batchName || `Đợt ${rIdx + 1}`)}
                                            </td>
                                            <td className="py-2 px-3">
                                              {rec.status === 'circulating' ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                  Quay vòng (Xưởng sửa xong)
                                                </span>
                                              ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                                  Mới 100%
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">+{rec.quantity.toLocaleString()} {m.unit}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="py-3 px-4 bg-slate-50 rounded-lg text-slate-500 text-xs flex items-center justify-between border border-slate-200">
                                    <span>
                                      Chưa có phiếu nhập chi tiết phát sinh trong năm {selectedYear}. Số lượng nhập hiện tại là phân bổ định mức ({m.import.toLocaleString()} {m.unit}).
                                    </span>
                                    <a
                                      href="/contracts"
                                      className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 text-[11px] whitespace-nowrap ml-2"
                                    >
                                      Đến Hợp Đồng Mua Sắm <ArrowRight className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* BẢNG 2: LỊCH SỬ CÁC LẦN XUẤT KHO */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                                    <ArrowUpRight className="w-4 h-4 text-amber-600" />
                                    2. Lịch Sử Các Đợt / Phiếu Xuất Kho ({exportRecords.length} lần phát sinh)
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    Gồm: Cấp phát 12 đơn vị trực thuộc & Xuất bổ sung sang xưởng sửa chữa
                                  </span>
                                </div>

                                {hasExportRecords ? (
                                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-amber-50/70 text-amber-900 font-semibold border-b border-amber-100 text-[11px]">
                                        <tr>
                                          <th className="py-2 px-3">Mã Phiếu Xuất</th>
                                          <th className="py-2 px-3">Ngày Xuất</th>
                                          <th className="py-2 px-3">Lý Do Xuất / Nghiệp Vụ</th>
                                          <th className="py-2 px-3">Nơi Tiếp Nhận / Đơn Vị</th>
                                          <th className="py-2 px-3">Tình Trạng Hàng</th>
                                          <th className="py-2 px-3 text-right">Số Lượng Xuất</th>
                                          <th className="py-2 px-3">Ghi Chú Nghiệp Vụ</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-sans">
                                        {exportRecords.map((exp, eIdx) => {
                                          const isSupplement = exp.exportReason?.includes('thay đổi kế hoạch') || exp.destinationName?.includes('Xưởng');
                                          return (
                                            <tr key={eIdx} className="hover:bg-amber-50/30">
                                              <td className="py-2 px-3 font-mono font-bold text-amber-800">{exp.voucherCode}</td>
                                              <td className="py-2 px-3 text-slate-700 font-mono">{exp.voucherDate || '-'}</td>
                                              <td className="py-2 px-3">
                                                {isSupplement ? (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                                    <RotateCcw className="w-3 h-3 text-purple-600" />
                                                    {exp.exportReason}
                                                  </span>
                                                ) : (
                                                  <span className="font-medium text-slate-800">
                                                    {exp.exportReason || 'Xuất cấp nước sạch'}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-2 px-3 font-semibold text-brand-900">
                                                {exp.destinationName || '-'}
                                              </td>
                                              <td className="py-2 px-3">
                                                {exp.status === 'circulating' ? (
                                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                    Quay vòng (Đã sửa)
                                                  </span>
                                                ) : (
                                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                                    Mới 100%
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-2 px-3 text-right font-mono font-black text-amber-700">-{exp.quantity.toLocaleString()} {m.unit}</td>
                                              <td className="py-2 px-3 text-slate-500 text-[11px] italic">
                                                {exp.notes || '-'}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="py-3 px-4 bg-slate-50 rounded-lg text-slate-500 text-xs flex items-center justify-between border border-slate-200">
                                    <span>
                                      Chưa có phiếu xuất chi tiết phát sinh trong năm {selectedYear}. Số lượng xuất hiện tại theo sổ kế hoạch ({m.export.toLocaleString()} {m.unit}).
                                    </span>
                                    <a
                                      href="/export"
                                      className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 text-[11px] whitespace-nowrap ml-2"
                                    >
                                      Đến Xuất Kho Đồng Hồ <ArrowRight className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Chú thích & Hướng dẫn */}
          <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                <strong>Tự Động Đồng Bộ Đồng Hồ:</strong> Số lượng nhập từ hợp đồng mua sắm và xưởng sửa chữa hoàn tất đều tự động cộng dồn vào <strong>Nhập Kho</strong> và cập nhật <strong>Cuối Kỳ</strong>.
              </span>
            </div>
            <div className="text-slate-500 italic">
              * Bấm vào từng dòng đồng hồ để xem chi tiết danh sách phiếu nhập và nguồn nhập
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VẬT TƯ SỬA CHỮA */}
      {activeTab === 'parts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div>
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Boxes className="w-4 h-4 text-brand-600" />
                Kho Linh Kiện — Nhập / Xuất Dùng / Tồn Năm {selectedYear}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tổng hợp toàn bộ biến động tồn kho linh kiện: mọi phiếu nhập kho từ hợp đồng mua sắm và mọi phiếu xuất dùng từ phiếu sửa chữa đều được tính vào kho theo từng loại linh kiện
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Năm:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-bold text-brand-700 text-xs shadow-2xs"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>Năm {yr}</option>
                ))}
              </select>
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                35 Mã Vật Tư
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">STT</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Tên Vật Tư Linh Kiện</th>
                  <th className="py-2.5 px-2 text-center w-14">ĐVT</th>
                  <th className="py-2.5 px-3 text-right min-w-[80px]">Tồn Đầu Kỳ</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700 min-w-[90px]">Tổng Nhập</th>
                  <th className="py-2.5 px-4 min-w-[220px]">Các Đợt / Lần Nhập Kho</th>
                  <th className="py-2.5 px-3 text-right text-amber-700 min-w-[85px]">Tổng Sử Dụng</th>
                  <th className="py-2.5 px-3 text-right font-bold text-brand-900 min-w-[90px] bg-brand-50/40">Tồn Cuối Kỳ</th>
                  <th className="py-2.5 px-2 text-center w-14">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const isDN15Part = (part: any) => {
                    const n = (part.name || '').toLowerCase();
                    const c = (part.category || '').toLowerCase();
                    const s = (part.size || '').toLowerCase();
                    if (n.includes('d15') || n.includes('dn15') || n.includes('d 15') || n.includes('dn 15')) return true;
                    if (c.includes('d15') || c.includes('dn15')) return true;
                    if (s.includes('15')) return true;
                    if (part.stt !== undefined && part.stt <= 13) return true;
                    return false;
                  };

                  const rawList = currentYearData.partsBalance || sparePartsOracle || [];
                  const sortedList = [...rawList].sort((a: any, b: any) => {
                    const a15 = isDN15Part(a);
                    const b15 = isDN15Part(b);
                    if (a15 && !b15) return -1;
                    if (!a15 && b15) return 1;
                    return (a.stt || 0) - (b.stt || 0);
                  });

                  return sortedList.map((p: any, idx: number) => {
                    const displayStt = idx + 1;
                    const effectiveOpening = localPartOverrides[String(selectedYear)]?.[p.name] !== undefined
                      ? localPartOverrides[String(selectedYear)][p.name]
                      : (p.opening || 0);
                    const imp = p.import ?? p.total_import ?? 0;
                    const usd = p.used ?? p.total_used ?? 0;
                    const effectiveEnding = effectiveOpening + imp - usd;
                    const isExpanded = expandedPartStt === p.stt;
                    const records: any[] = p.importRecords || [];
                    const usedRecords: any[] = p.usedRecords || [];
                    const hasRecords = records.length > 0;
                    const hasUsedRecords = usedRecords.length > 0;
                    const isEditingThis = editingPartKey === p.name;

                    return (
                      <React.Fragment key={p.stt || idx}>
                        <tr 
                          className={`transition-colors ${
                            isExpanded ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td 
                            onClick={() => setExpandedPartStt(isExpanded ? null : p.stt)}
                            className="py-2.5 px-3 text-center font-mono text-slate-400 font-medium cursor-pointer"
                          >
                            {displayStt}
                          </td>
                        <td 
                          onClick={() => setExpandedPartStt(isExpanded ? null : p.stt)}
                          className="py-2.5 px-4 font-semibold text-slate-900 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{(p.name || '').replace(/\n/g, ' ')}</span>
                            {p.category && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-100 text-purple-800">
                                {p.category}
                              </span>
                            )}
                            {hasRecords && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                +{records.length} lần nhập
                              </span>
                            )}
                            {hasUsedRecords && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                -{usedRecords.length} lần dùng
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-500 font-medium">
                          {p.unit}
                        </td>

                        {/* Cột Tồn Đầu Kỳ có thể chỉnh sửa trực tiếp */}
                        <td className="py-2 px-2 text-right">
                          {isEditingThis ? (
                            <div className="inline-flex items-center gap-1 bg-white border-2 border-brand-500 rounded-lg p-1 shadow-md z-20">
                              <input
                                type="number"
                                min={0}
                                value={editingPartValue}
                                onChange={(e) => setEditingPartValue(Number(e.target.value))}
                                className="w-20 text-right font-mono text-xs font-bold px-1.5 py-0.5 border border-slate-200 rounded focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSavePartOpening(p.name)}
                                disabled={savingOpening}
                                className="p-1 bg-brand-600 hover:bg-brand-500 text-white rounded text-[11px]"
                                title="Lưu tồn đầu kỳ"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPartKey(null)}
                                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px]"
                                title="Hủy"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isAdmin ? (
                            <div 
                              onClick={() => {
                                setEditingPartKey(p.name);
                                setEditingPartValue(effectiveOpening);
                              }}
                              className="group inline-flex items-center justify-end gap-1 cursor-pointer py-1 px-1.5 rounded hover:bg-brand-50 transition-colors"
                              title="Bấm để sửa Tồn Đầu Kỳ"
                            >
                              <span className="font-mono text-slate-700 font-semibold group-hover:text-brand-700">
                                {effectiveOpening.toLocaleString()}
                              </span>
                              <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ) : (
                            <span className="font-mono text-slate-700 font-semibold py-1 px-1.5">
                              {effectiveOpening.toLocaleString()}
                            </span>
                          )}

                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold bg-emerald-50/30">
                          {imp.toLocaleString()}
                        </td>

                        {/* Cột Chi Tiết Các Đợt Nhập */}
                        <td className="py-2 px-4">
                          {hasRecords ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {records.slice(0, 2).map((rec, rIdx) => (
                                <span 
                                  key={rIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold"
                                  title={`${rec.voucherCode} (${rec.voucherDate}): +${rec.quantity.toLocaleString()} ${p.unit}`}
                                >
                                  <span className="font-mono text-emerald-700">{rec.batchName || rec.voucherCode}:</span>
                                  <span className="font-bold">+{rec.quantity.toLocaleString()}</span>
                                </span>
                              ))}
                              {records.length > 2 && (
                                <span className="text-[10px] text-slate-500 font-bold">
                                  +{records.length - 2} đợt khác...
                                </span>
                              )}
                            </div>
                          ) : (p.import > 0 ? (
                            <span className="text-[11px] text-slate-400 italic">
                              Nhập cơ sở ({p.import.toLocaleString()} {p.unit})
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          ))}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-semibold">
                          {usd.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 bg-brand-50/30">
                          {effectiveEnding.toLocaleString()}
                        </td>

                        <td
                          className="py-2.5 px-2 text-center cursor-pointer"
                          onClick={() => setExpandedPartStt(isExpanded ? null : p.stt)}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPartStt(isExpanded ? null : p.stt);
                            }}
                            className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                            title={isExpanded ? "Đóng sổ chi tiết" : "Mở sổ chi tiết Nhập - Xuất Dùng - Tồn"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-brand-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable row: Sổ chi tiết nhập và xuất dùng vật tư sửa chữa */}
                      {isExpanded && (
                        <tr className="bg-slate-50/95 border-y border-amber-200">
                          <td colSpan={9} className="p-4 sm:p-5">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-5">
                              {/* Header sổ chi tiết */}
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                                    <Wrench className="w-5 h-5 text-brand-600" />
                                    Sổ Chi Tiết Nhập - Xuất Dùng - Tồn Vật Tư: {(p.name || '').replace(/\n/g, ' ')} (STT #{p.stt})
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Đơn vị tính: <strong>{p.unit}</strong> • Công thức: Tồn Cuối ({effectiveEnding.toLocaleString()}) = Tồn Đầu ({effectiveOpening.toLocaleString()}) + Tổng Nhập ({imp.toLocaleString()}) - Tổng Xuất Dùng ({usd.toLocaleString()})
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="text-slate-500">Đầu Kỳ:</span> <strong className="font-mono text-slate-800">{effectiveOpening.toLocaleString()}</strong>
                                  </div>
                                  <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                                    <span>Tổng Nhập:</span> <strong className="font-mono font-bold">+{imp.toLocaleString()}</strong>
                                  </div>
                                  <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                                    <span>Xuất Dùng SC:</span> <strong className="font-mono font-bold">-{usd.toLocaleString()}</strong>
                                  </div>
                                  <div className="px-2.5 py-1 bg-brand-50 border border-brand-200 rounded-lg text-brand-900 font-bold">
                                    <span>Tồn Cuối:</span> <strong className="font-mono">{effectiveEnding.toLocaleString()}</strong> {p.unit}
                                  </div>
                                </div>
                              </div>

                              {/* BẢNG 1: LỊCH SỬ CÁC LẦN NHẬP KHO LINH KIỆN */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                                    1. Lịch Sử Các Đợt / Phiếu Nhập Kho Linh Kiện ({records.length} lần phát sinh)
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    Theo đợt giao hàng từ hợp đồng mua sắm
                                  </span>
                                </div>

                                {hasRecords ? (
                                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-emerald-50/70 text-emerald-900 font-semibold border-b border-emerald-100 text-[11px]">
                                        <tr>
                                          <th className="py-2 px-3">Mã Phiếu Nhập</th>
                                          <th className="py-2 px-3">Ngày Nhập</th>
                                          <th className="py-2 px-3">Hợp Đồng Mua Sắm</th>
                                          <th className="py-2 px-3">Đợt Giao Hàng</th>
                                          <th className="py-2 px-3 text-right">Số Lượng Nhập</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-sans">
                                        {records.map((rec, rIdx) => (
                                          <tr key={rIdx} className="hover:bg-emerald-50/40">
                                            <td className="py-2 px-3 font-mono font-bold text-brand-700">{rec.voucherCode}</td>
                                            <td className="py-2 px-3 text-slate-700 font-mono">{rec.voucherDate || '-'}</td>
                                            <td className="py-2 px-3 text-slate-800 font-medium">{rec.contractNumber || 'Hợp đồng mua sắm'}</td>
                                            <td className="py-2 px-3 text-emerald-800 font-medium">{rec.batchName || `Đợt ${rIdx + 1}`}</td>
                                            <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">+{rec.quantity.toLocaleString()} {p.unit}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="py-3 px-4 bg-slate-50 rounded-lg text-slate-500 text-xs flex items-center justify-between border border-slate-200">
                                    <span>
                                      Chưa có phiếu nhập linh kiện chi tiết trong năm {selectedYear}. Số lượng nhập hiện tại là định mức phân bổ ({imp.toLocaleString()} {p.unit}).
                                    </span>
                                    <a
                                      href="/contracts"
                                      className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 text-[11px] whitespace-nowrap ml-2"
                                    >
                                      Đến Hợp Đồng Mua Sắm <ArrowRight className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* BẢNG 2: LỊCH SỬ XUẤT DÙNG SỬA CHỮA */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                                    <Wrench className="w-4 h-4 text-amber-700" />
                                    2. Lịch Sử Xuất Dùng Sửa Chữa Đồng Hồ ({usedRecords.length} lần phát sinh)
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    Theo phiếu sửa chữa: loại đồng hồ, số lượng linh kiện, kỹ thuật viên
                                  </span>
                                </div>

                                {hasUsedRecords ? (
                                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-amber-50/70 text-amber-900 font-semibold border-b border-amber-100 text-[11px]">
                                        <tr>
                                          <th className="py-2 px-3">Mã Phiếu SC</th>
                                          <th className="py-2 px-3">Ngày SC</th>
                                          <th className="py-2 px-3">Loại Đồng Hồ Sửa</th>
                                          <th className="py-2 px-3">Kỹ Thuật Viên</th>
                                          <th className="py-2 px-3 text-right">Số Lượng Dùng</th>
                                          <th className="py-2 px-3">Ghi Chú</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-sans">
                                        {usedRecords.map((used, uIdx) => (
                                          <tr key={uIdx} className="hover:bg-amber-50/30">
                                            <td className="py-2 px-3 font-mono font-bold text-amber-800">{used.voucherCode}</td>
                                            <td className="py-2 px-3 text-slate-700 font-mono">{used.voucherDate || '-'}</td>
                                            <td className="py-2 px-3 font-semibold text-slate-800">{used.meterName || 'Đồng hồ sửa chữa'}</td>
                                            <td className="py-2 px-3 text-slate-600">{used.technicianName || '-'}</td>
                                            <td className="py-2 px-3 text-right font-mono font-black text-amber-700">-{used.quantity.toLocaleString()} {p.unit}</td>
                                            <td className="py-2 px-3 text-slate-500 text-[11px] italic">{used.notes || '-'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="py-3 px-4 bg-slate-50 rounded-lg text-slate-500 text-xs flex items-center justify-between border border-slate-200">
                                    <span>
                                      Chưa có phiếu xuất dùng sửa chữa chi tiết trong năm {selectedYear}. Tổng xuất dùng hiện tại: ({usd.toLocaleString()} {p.unit}).
                                    </span>
                                    <a
                                      href="/repair"
                                      className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 text-[11px] whitespace-nowrap ml-2"
                                    >
                                      Đến Phiếu Sửa Chữa <ArrowRight className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                });
              })()}
              </tbody>
            </table>
          </div>

          {/* Chú thích & Hướng dẫn */}
          <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                <strong>Tự Động Đồng Bộ:</strong> Mọi phiếu nhập kho từ Hợp đồng & file Excel đều tự động cộng vào <strong>Tổng Nhập</strong> và cập nhật <strong>Tồn Cuối Kỳ</strong>.
              </span>
            </div>
            <div className="text-slate-500 italic">
              * Bấm vào từng dòng vật tư để mở Sổ Chi Tiết: Lịch Sử Nhập Kho (Hợp đồng mua sắm) và Lịch Sử Xuất Dùng Sửa Chữa (Phiếu sửa chữa)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
