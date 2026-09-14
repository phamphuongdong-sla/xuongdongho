'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Truck, 
  RotateCcw, 
  Table2, 
  LayoutGrid, 
  LineChart, 
  Wrench, 
  Printer, 
  FileSpreadsheet, 
  BarChart3, 
  ArrowRight,
  Send,
  Eye,
  CheckCircle2,
  Save,
  Trash2,
  Sparkles,
  Loader2
} from 'lucide-react';
import type { SessionUser } from '@/types';
import { saveUnitYearlyPlans, saveUnitUsedYearlyPlans } from '@/actions/reports';

export function UnitReportsClientView({
  availableYears = [2025, 2026, 2027, 2028, 2029, 2030],
  yearlyData = {},
  unitSummaries,
  currentUser,
  allExportVouchers = [],
  unitsList = [],
  initialYearlyPlans = {},
  initialUsedYearlyPlans = {},
}: {
  availableYears?: number[];
  yearlyData?: Record<number, any>;
  unitSummaries: any[];
  currentUser?: SessionUser | null;
  allExportVouchers?: any[];
  unitsList?: any[];
  initialYearlyPlans?: Record<string, number>;
  initialUsedYearlyPlans?: Record<string, number>;
}) {
  const [activeTab, setActiveTab] = useState<'monthlyExport' | 'usedMeters'>('monthlyExport');
  const [displayMode, setDisplayMode] = useState<'matrix' | 'cards' | 'timeline'>('timeline');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = `Tháng ${now.getMonth() + 1}`;
  const defaultYear = availableYears.includes(currentYear)
    ? currentYear
    : (availableYears[availableYears.length - 1] || currentYear);

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [meterTypeFilter, setMeterTypeFilter] = useState<'all' | 'new' | 'circ'>('all');
  const [selectedProductCode, setSelectedProductCode] = useState<string>('ĐH015(SC)');
  const [selectedUsedProductCode, setSelectedUsedProductCode] = useState<string>('ĐH015(SC)');
  const [fitMode, setFitMode] = useState<boolean>(true);
  const [usedViewDetail, setUsedViewDetail] = useState<boolean>(false);
  const [expandedMeterCode, setExpandedMeterCode] = useState<string | null>(null);

  const [yearlyPlans, setYearlyPlans] = useState<Record<string, number>>(initialYearlyPlans || {});
  const [planSaveStatus, setPlanSaveStatus] = useState<string | null>(null);

  const [usedYearlyPlans, setUsedYearlyPlans] = useState<Record<string, number>>(initialUsedYearlyPlans || {});
  const [usedPlanSaveStatus, setUsedPlanSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sowasuco_unit_yearly_plans');
        if (saved) {
          const parsed = JSON.parse(saved);
          setYearlyPlans((prev) => ({ ...prev, ...parsed }));
        }
        const savedUsed = localStorage.getItem('sowasuco_unit_used_yearly_plans');
        if (savedUsed) {
          const parsedUsed = JSON.parse(savedUsed);
          setUsedYearlyPlans((prev) => ({ ...prev, ...parsedUsed }));
        }
      } catch (e) {
        console.error('Error reading unit yearly plans from localStorage:', e);
      }
    }
  }, []);

  const handlePlanChange = (planKey: string, val: number) => {
    const updated = { ...yearlyPlans, [planKey]: Math.max(0, val) };
    setYearlyPlans(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sowasuco_unit_yearly_plans', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving unit yearly plans to localStorage:', e);
      }
    }
    setPlanSaveStatus('Đã lưu');
    saveUnitYearlyPlans(updated)
      .then(() => {
        setTimeout(() => setPlanSaveStatus(null), 2500);
      })
      .catch(() => {});
  };

  const handleUsedPlanChange = (planKey: string, val: number) => {
    const updated = { ...usedYearlyPlans, [planKey]: Math.max(0, val) };
    setUsedYearlyPlans(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sowasuco_unit_used_yearly_plans', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving unit used yearly plans to localStorage:', e);
      }
    }
    setUsedPlanSaveStatus('Đã lưu');
    saveUnitUsedYearlyPlans(updated)
      .then(() => {
        setTimeout(() => setUsedPlanSaveStatus(null), 2500);
      })
      .catch(() => {});
  };

  const handleAutoFillPlans = () => {
    const updated = { ...yearlyPlans };
    unitHeaders.forEach((u) => {
      let total = 0;
      if (selectedProductCode === 'all') {
        u.meters.forEach((meter: any) => {
          monthsList.forEach((m) => {
            const mData = meter.months?.[m];
            total += mData?.total || ((mData?.new || 0) + (mData?.circ || 0));
          });
        });
      } else {
        const targetMeter = u.meters.find((meter: any) => meter.code === selectedProductCode || meter.name === selectedProductCode);
        monthsList.forEach((m) => {
          const mData = targetMeter?.months?.[m];
          total += mData?.total || ((mData?.new || 0) + (mData?.circ || 0));
        });
      }
      const planKey = `${selectedYear}_${selectedProductCode}_${u.key}`;
      updated[planKey] = total;
    });
    setYearlyPlans(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sowasuco_unit_yearly_plans', JSON.stringify(updated));
    }
    setPlanSaveStatus('Đã điền');
    saveUnitYearlyPlans(updated)
      .then(() => setTimeout(() => setPlanSaveStatus(null), 2500))
      .catch(() => {});
  };

  const handleAutoFillUsedPlans = () => {
    const updated = { ...usedYearlyPlans };
    usedUnitHeaders.forEach((u) => {
      let total = 0;
      if (selectedUsedProductCode === 'all') {
        (u.meters || []).forEach((meter: any) => {
          monthsList.forEach((m) => {
            const mData = meter.months?.[m];
            total += mData?.total || 0;
          });
        });
      } else {
        const targetMeter = (u.meters || []).find((meter: any) => meter.code === selectedUsedProductCode || meter.name === selectedUsedProductCode);
        monthsList.forEach((m) => {
          const mData = targetMeter?.months?.[m];
          total += mData?.total || 0;
        });
      }
      const planKey = `${selectedYear}_${selectedUsedProductCode}_${u.key}`;
      updated[planKey] = total;
    });
    setUsedYearlyPlans(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sowasuco_unit_used_yearly_plans', JSON.stringify(updated));
    }
    setUsedPlanSaveStatus('Đã điền');
    saveUnitUsedYearlyPlans(updated)
      .then(() => setTimeout(() => setUsedPlanSaveStatus(null), 2500))
      .catch(() => {});
  };

  const handleClearPlans = () => {
    const updated = { ...yearlyPlans };
    unitHeaders.forEach((u) => {
      const planKey = `${selectedYear}_${selectedProductCode}_${u.key}`;
      delete updated[planKey];
    });
    setYearlyPlans(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sowasuco_unit_yearly_plans', JSON.stringify(updated));
    }
    setPlanSaveStatus('Đã xóa');
    saveUnitYearlyPlans(updated)
      .then(() => setTimeout(() => setPlanSaveStatus(null), 2500))
      .catch(() => {});
  };

  const handleClearUsedPlans = () => {
    const updated = { ...usedYearlyPlans };
    usedUnitHeaders.forEach((u) => {
      const planKey = `${selectedYear}_${selectedUsedProductCode}_${u.key}`;
      delete updated[planKey];
    });
    setUsedYearlyPlans(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sowasuco_unit_used_yearly_plans', JSON.stringify(updated));
    }
    setUsedPlanSaveStatus('Đã xóa');
    saveUnitUsedYearlyPlans(updated)
      .then(() => setTimeout(() => setUsedPlanSaveStatus(null), 2500))
      .catch(() => {});
  };

  const formatUnitTimelineName = (abbr: string, fullName: string): string => {
    if (abbr === 'TP1') return 'XNCN SỐ 1';
    if (abbr === 'TP2') return 'XNCN SỐ 2';
    if (abbr === 'MS') return 'XNCN MAI SƠN';
    if (abbr === 'MC') return 'CNCN MỘC CHÂU';
    if (abbr === 'YC') return 'CNCN YÊN CHÂU';
    if (abbr === 'PY') return 'CNCN PHÙ YÊN';
    if (abbr === 'BY') return 'CNCN BẮC YÊN';
    if (abbr === 'SM') return 'CNCN SÔNG MÃ';
    if (abbr === 'SC') return 'CNCN SỐP CỘP';
    if (abbr === 'TC') return 'CNCN THUẬN CHÂU';
    if (abbr === 'ML') return 'CNCN MƯỜNG LA';
    if (abbr === 'QN') return 'CNCN QUỲNH NHAI';
    return fullName.toUpperCase();
  };

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

  const productsList: any[] = currentYearData.products || [];

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

  // Auto ensure default selection is "Đồng hồ 15 sửa chữa"
  useEffect(() => {
    if (productsList.length > 0 && selectedProductCode !== 'all') {
      const exists = productsList.some((p: any) => p.code === selectedProductCode);
      if (!exists) {
        const target = productsList.find((p: any) => 
          p.code === 'ĐH015(SC)' || 
          (p.code?.includes('015') && p.code?.includes('SC')) ||
          (p.name?.toLowerCase().includes('15') && p.name?.toLowerCase().includes('sửa chữa'))
        );
        if (target) {
          setSelectedProductCode(target.code);
        }
      }
    }
  }, [productsList, selectedProductCode]);

  useEffect(() => {
    if (usedProductsList.length > 0 && selectedUsedProductCode !== 'all') {
      const exists = usedProductsList.some((p: any) => p.code === selectedUsedProductCode);
      if (!exists) {
        const target = usedProductsList.find((p: any) => 
          p.code === 'ĐH015(SC)' || 
          (p.code?.includes('015') && p.code?.includes('SC')) ||
          (p.name?.toLowerCase().includes('15') && p.name?.toLowerCase().includes('sửa chữa'))
        );
        if (target) {
          setSelectedUsedProductCode(target.code);
        }
      }
    }
  }, [usedProductsList, selectedUsedProductCode]);

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  const handleExportTimelineExcel = async (isUsed: boolean) => {
    try {
      setIsExportingExcel(true);
      const targetHeaders = isUsed ? usedUnitHeaders : unitHeaders;
      const targetProdCode = isUsed ? selectedUsedProductCode : selectedProductCode;
      const targetPlans = isUsed ? usedYearlyPlans : yearlyPlans;
      const prodList = isUsed ? usedProductsList : productsList;
      const matchedProd = prodList.find((p: any) => p.code === targetProdCode);
      const productName = targetProdCode === 'all' 
        ? 'Tất cả loại đồng hồ (Tổng hợp)' 
        : matchedProd ? `[${matchedProd.code}] ${matchedProd.name}` : targetProdCode;

      const rows = targetHeaders.map((u, idx) => {
        const uMeters = u.meters || [];
        let uTotal = 0;
        const months = monthsList.map((m) => {
          let val = 0;
          if (targetProdCode === 'all') {
            uMeters.forEach((meter: any) => {
              const mData = meter.months?.[m];
              val += isUsed ? (mData?.total || 0) : (mData?.total || ((mData?.new || 0) + (mData?.circ || 0)));
            });
          } else {
            const targetMeter = uMeters.find((meter: any) => meter.code === targetProdCode || meter.name === targetProdCode);
            const mData = targetMeter?.months?.[m];
            val = isUsed ? (mData?.total || 0) : (mData?.total || ((mData?.new || 0) + (mData?.circ || 0)));
          }
          uTotal += val;
          return val;
        });

        const planKey = `${selectedYear}_${targetProdCode}_${u.key}`;
        const planVal = targetPlans[planKey] || 0;
        const planMonth = planVal > 0 ? Math.round(planVal / 12) : 0;
        const remaining = planVal > 0 ? Math.max(0, planVal - uTotal) : 0;

        return {
          stt: idx + 1,
          unitName: formatUnitTimelineName(u.abbr, u.fullName),
          months,
          total: uTotal,
          planMonth,
          planYear: planVal,
          remaining,
        };
      });

      const totMonths = monthsList.map((m, mIdx) => {
        return rows.reduce((sum, r) => sum + (r.months[mIdx] || 0), 0);
      });
      const totTotal = rows.reduce((sum, r) => sum + r.total, 0);
      const totPlanYear = rows.reduce((sum, r) => sum + r.planYear, 0);
      const totPlanMonth = totPlanYear > 0 ? Math.round(totPlanYear / 12) : 0;
      const totRemaining = rows.reduce((sum, r) => sum + r.remaining, 0);

      const payload = {
        reportType: isUsed ? 'used_timeline' : 'export_timeline',
        title: isUsed
          ? `BẢNG TIẾN ĐỘ THU HỒI ĐỒNG HỒ CŨ 12 THÁNG NĂM ${selectedYear}`
          : `BẢNG TIẾN ĐỘ XUẤT ĐỒNG HỒ 12 THÁNG NĂM ${selectedYear}`,
        subtitle: `Loại đồng hồ: ${productName}`,
        year: selectedYear,
        productName,
        rows,
        totals: {
          months: totMonths,
          total: totTotal,
          planMonth: totPlanMonth,
          planYear: totPlanYear,
          remaining: totRemaining,
        },
        creatorName: currentUser?.fullName || 'Đồng Đức Anh',
        deptManagerName: 'Phạm Phương Đông',
        workshopManagerName: 'Bùi Đức Duy',
      };

      const res = await fetch('/api/export-unit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Không thể tạo file Excel');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = isUsed
        ? `Tien_Do_Thu_Hoi_DH_Cu_${selectedYear}.xlsx`
        : `Tien_Do_Xuat_Dong_Ho_12_Thang_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('Có lỗi xảy ra khi xuất file Excel: ' + (err.message || err));
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportMatrixExcel = async (isUsed: boolean) => {
    try {
      setIsExportingExcel(true);
      const targetHeaders = isUsed ? usedUnitHeaders : unitHeaders;
      const prodList = isUsed ? usedProductsList : productsList;

      const matrixHeaders = [
        'STT',
        'Loại Đồng Hồ',
        'ĐVT',
        ...targetHeaders.map((u) => u.abbr),
        'Tổng Cộng',
      ];

      const matrixRows = prodList.map((prod: any, idx: number) => {
        let rowTotal = 0;
        const values = targetHeaders.map((u) => {
          const uMeter = u.meters.find((m: any) => m.code === prod.code || m.name === prod.name);
          let val = 0;
          if (uMeter) {
            if (selectedMonth === 'all') {
              if (isUsed) {
                val = uMeter.year_total?.total || 0;
              } else {
                const newQty = uMeter.year_total?.new || 0;
                const circQty = uMeter.year_total?.circ || 0;
                val = meterTypeFilter === 'all' ? (newQty + circQty) : meterTypeFilter === 'new' ? newQty : circQty;
              }
            } else {
              const mData = uMeter.months?.[selectedMonth];
              if (isUsed) {
                val = mData?.total || 0;
              } else {
                const newQty = mData?.new || 0;
                const circQty = mData?.circ || 0;
                val = meterTypeFilter === 'all' ? (newQty + circQty) : meterTypeFilter === 'new' ? newQty : circQty;
              }
            }
          }
          rowTotal += val;
          return val;
        });

        return {
          stt: idx + 1,
          name: prod.name,
          unit: prod.unit || 'Cái',
          values,
          total: rowTotal,
        };
      });

      const matrixTotals = {
        values: isUsed ? usedColTotals : colTotals.map((c) => c.total),
        total: isUsed ? grandTotalUsedReceived : grandTotal,
      };

      const payload = {
        reportType: 'matrix' as const,
        title: isUsed
          ? `BẢNG TỔNG HỢP NHẬP KHO ĐỒNG HỒ CŨ 12 ĐƠN VỊ - NĂM ${selectedYear}`
          : `BẢNG TỔNG HỢP XUẤT KHO ĐỒNG HỒ 12 ĐƠN VỊ - NĂM ${selectedYear}`,
        subtitle: `Kỳ báo cáo: ${selectedMonth === 'all' ? `Cả Năm ${selectedYear}` : `${selectedMonth} / Năm ${selectedYear}`} | Phân loại: ${isUsed ? 'Đồng hồ cũ chuyển về sửa chữa' : (meterTypeFilter === 'all' ? 'ĐH Mới + ĐH Xưởng Sửa' : meterTypeFilter === 'new' ? 'Chỉ ĐH Mới' : 'Chỉ ĐH Xưởng Sửa')}`,
        year: selectedYear,
        matrixHeaders,
        matrixRows,
        matrixTotals,
        creatorName: currentUser?.fullName || 'Đồng Đức Anh',
        deptManagerName: 'Phạm Phương Đông',
        workshopManagerName: 'Bùi Đức Duy',
      };

      const res = await fetch('/api/export-unit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Không thể tạo file Excel');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = isUsed
        ? `Tong_Hop_Nhap_Kho_DH_Cu_${selectedYear}.xlsx`
        : `Tong_Hop_Xuat_Kho_12_Don_Vi_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('Có lỗi xảy ra khi xuất file Excel: ' + (err.message || err));
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
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
            onClick={() => {
              setActiveTab('monthlyExport');
              setDisplayMode('timeline');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'monthlyExport'
                ? 'bg-white text-brand-700 shadow-sm border border-brand-200/80 ring-1 ring-brand-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Truck className={`w-4 h-4 ${activeTab === 'monthlyExport' ? 'text-brand-600' : 'text-slate-400'}`} />
            <span>BC Xuất kho</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
              activeTab === 'monthlyExport' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200/70 text-slate-500'
            }`}>
              12 Đơn Vị
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('usedMeters');
              setDisplayMode('timeline');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'usedMeters'
                ? 'bg-white text-amber-700 shadow-sm border border-amber-200/80 ring-1 ring-amber-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${activeTab === 'usedMeters' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>BC Nhập Kho</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
              activeTab === 'usedMeters' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200/70 text-slate-500'
            }`}>
              ĐH Cũ 12 ĐV
            </span>
          </button>
        </div>

        <Link
          href="/reports"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 hover:bg-white/80 rounded-lg transition-colors"
          title="Chuyển sang Báo cáo tổng đối soát 25 SKU và 35 SKU linh kiện"
        >
          <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
          <span>Báo Cáo Tổng</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {activeTab === 'monthlyExport' && (
        <div className="space-y-6">
          {/* Top Control Bar with View Mode Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Mode Switcher Buttons */}
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Chọn Cách Trình Bày Dễ Xem:
                </span>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
                  <button
                    onClick={() => setDisplayMode('timeline')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      displayMode === 'timeline'
                        ? 'bg-white text-brand-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LineChart className="w-4 h-4 text-indigo-600" />
                    Tiến Độ Xuất 12 Tháng
                  </button>

                  <button
                    onClick={() => setDisplayMode('matrix')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      displayMode === 'matrix'
                        ? 'bg-white text-brand-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table2 className="w-4 h-4 text-brand-600" />
                    Tổng Hợp Theo Loại ĐH (12 ĐV)
                  </button>

                  <button
                    onClick={() => setDisplayMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      displayMode === 'cards'
                        ? 'bg-white text-brand-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 text-emerald-600" />
                    Sổ chi tiết xuất (tháng)
                  </button>
                </div>
              </div>

              {/* Filters for Year, Month & Meter Status */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Year Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Năm:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(Number(e.target.value));
                    }}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white font-black text-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        Năm {yr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Thời Gian:
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white font-bold text-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs"
                  >
                    <option value="all">Tổng Hợp Cả Năm {selectedYear}</option>
                    {monthsList.map((m) => (
                      <option key={m} value={m}>
                        {m} ({selectedYear})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Switcher */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Nguồn Đồng Hồ:
                  </label>
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                    <button
                      onClick={() => setMeterTypeFilter('all')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        meterTypeFilter === 'all'
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tất Cả
                    </button>
                    <button
                      onClick={() => setMeterTypeFilter('new')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        meterTypeFilter === 'new'
                          ? 'bg-blue-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Chỉ ĐH Mới
                    </button>
                    <button
                      onClick={() => setMeterTypeFilter('circ')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        meterTypeFilter === 'circ'
                          ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Chỉ Xưởng Sửa
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Note banner */}
            <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-100 text-slate-500">
              <span>
                {displayMode === 'matrix' && '💡 Bảng 2 chiều: Hàng dọc là các loại ĐH, Hàng ngang là 12 Đơn vị. Dễ đối soát nhất.'}
                {displayMode === 'cards' && '💡 Sổ chi tiết: Mỗi chi nhánh 1 sổ riêng, liệt kê chi tiết các loại đồng hồ đơn vị đó đã nhận.'}
                {displayMode === 'timeline' && '💡 Tiến độ: Soi chi tiết từng tháng từ Tháng 1 đến Tháng 12 cho từng mã đồng hồ.'}
              </span>
              <span className="text-emerald-700 font-semibold">
                * Đã lược bỏ cột Mã ĐV và Phân Cấp theo quy định
              </span>
            </div>
          </div>

          {/* MODE 1: BẢNG TỔNG HỢP THEO LOẠI ĐỒNG HỒ (12 ĐƠN VỊ) */}
          {displayMode === 'matrix' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-brand-600" />
                    Tổng hợp xuất kho theo loại đồng hồ
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kỳ: <strong className="text-brand-700">{selectedMonth === 'all' ? `Cả Năm ${selectedYear}` : `${selectedMonth} / Năm ${selectedYear}`}</strong> | 
                    Hiển thị: <strong className="text-brand-700">{meterTypeFilter === 'all' ? 'ĐH Mới + ĐH Xưởng Sửa' : meterTypeFilter === 'new' ? 'Chỉ ĐH Mới' : 'Chỉ ĐH Xưởng Sửa'}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                  {/* Nút chuyển đổi Chế độ Co dãn vừa khung màn hình / Cuộn ngang */}
                  <button
                    onClick={() => setFitMode(!fitMode)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      fitMode
                        ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title={fitMode ? "Đang bật chế độ tự động co dãn vừa vặn khung hình" : "Đang bật chế độ cuộn ngang tự do"}
                  >
                    <span className={`w-2 h-2 rounded-full ${fitMode ? 'bg-brand-600' : 'bg-slate-400'}`}></span>
                    <span>{fitMode ? 'Co Dãn (100%)' : 'Cuộn Ngang'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportMatrixExcel(false)}
                    disabled={isExportingExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
                    title="Tải bảng tính Excel tổng hợp phân bổ 12 đơn vị"
                  >
                    {isExportingExcel ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    <span>Xuất Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-2xs"
                    title="In biểu mẫu hoặc lưu file PDF (A4 ngang)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In / Xuất PDF</span>
                  </button>
                </div>
              </div>

              {/* Printable Official Header (Only shows on print/PDF) */}
              <div className="hidden print:block px-4 pt-3 pb-2 border-b border-slate-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-700">Công ty cổ phần cấp nước Sơn La</p>
                    <p className="text-xs font-bold uppercase text-slate-900">XƯỞNG ĐỒNG HỒ NƯỚC</p>
                  </div>
                  <div className="text-right text-xs italic text-slate-500">
                    Ngày in: {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="text-center my-3">
                  <h2 className="text-base font-black uppercase text-slate-900">
                    BẢNG TỔNG HỢP XUẤT KHO ĐỒNG HỒ 12 ĐƠN VỊ NĂM {selectedYear}
                  </h2>
                  <p className="text-xs text-slate-600 italic mt-0.5">
                    Kỳ: {selectedMonth === 'all' ? `Cả Năm ${selectedYear}` : `${selectedMonth} / Năm ${selectedYear}`} | Phân loại: {meterTypeFilter === 'all' ? 'Tất cả (ĐH Mới + ĐH Sửa)' : meterTypeFilter === 'new' ? 'Chỉ ĐH Mới' : 'Chỉ ĐH Xưởng Sửa'}
                  </p>
                </div>
              </div>

              <div className={fitMode ? "w-full overflow-x-auto lg:overflow-x-hidden" : "overflow-x-auto max-w-full"}>
                <table className={`w-full text-left border-collapse ${fitMode ? 'table-fixed text-[11px]' : 'text-xs min-w-[1050px]'}`}>
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] sticky top-0 z-20">
                    <tr>
                      <th className={`py-2.5 px-2 border-r border-slate-200 sticky left-0 bg-slate-100 z-30 font-bold text-slate-800 ${fitMode ? 'w-[22%]' : 'min-w-[170px]'}`}>
                        Loại Đồng Hồ
                      </th>
                      <th className={`py-2.5 px-1 text-center border-r border-slate-200 text-slate-600 ${fitMode ? 'w-[4%]' : 'w-10'}`}>
                        ĐVT
                      </th>
                      {unitHeaders.map((u) => (
                        <th 
                          key={u.key} 
                          title={`${u.abbr} - ${u.fullName} (Rê chuột xem tên chi nhánh)`}
                          className={`py-2 px-1 text-center border-r border-slate-200 cursor-help hover:bg-brand-100/70 transition-colors ${
                            fitMode ? 'w-[5.35%]' : 'min-w-[50px]'
                          }`}
                        >
                          <span className="font-mono font-black text-brand-800 text-[11px] block">
                            {u.abbr}
                          </span>
                        </th>
                      ))}
                      <th className={`py-2.5 px-2 text-right bg-brand-50 text-brand-900 font-black sticky right-0 z-30 ${fitMode ? 'w-[9.8%]' : 'min-w-[85px]'}`}>
                        TỔNG CỘNG
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {productsList.map((prod, pIdx) => {
                      let rowTotal = 0;
                      let rowTotalNew = 0;
                      let rowTotalCirc = 0;

                      return (
                        <tr key={prod.code || pIdx} className="hover:bg-slate-50 transition-colors">
                          {/* Tên loại đồng hồ */}
                          <td 
                            className={`py-2 px-2 font-semibold text-slate-900 border-r border-slate-200 sticky left-0 bg-white z-10 shadow-2xs ${fitMode ? 'truncate' : ''}`}
                            title={prod.name}
                          >
                            <span className="block text-slate-900 truncate font-semibold">{prod.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 block leading-none">{prod.code}</span>
                          </td>

                          <td className="py-2 px-1 text-center text-slate-500 border-r border-slate-200 text-[10px]">
                            {prod.unit || 'Cái'}
                          </td>

                          {/* 12 Cột Đơn Vị (TP1, TP2, MS, MC, YC, BY, TC, PY, ML, SM, SC, QN) */}
                          {unitHeaders.map((u) => {
                            const uMeter = u.meters.find((m: any) => m.code === prod.code || m.name === prod.name);
                            let uNew = 0;
                            let uCirc = 0;

                            if (uMeter) {
                              if (selectedMonth === 'all') {
                                uNew = uMeter.year_total?.new || 0;
                                uCirc = uMeter.year_total?.circ || 0;
                              } else {
                                const mData = uMeter.months?.[selectedMonth];
                                uNew = mData?.new || 0;
                                uCirc = mData?.circ || 0;
                              }
                            }

                            rowTotalNew += uNew;
                            rowTotalCirc += uCirc;

                            let displayVal = 0;
                            if (meterTypeFilter === 'all') displayVal = uNew + uCirc;
                            else if (meterTypeFilter === 'new') displayVal = uNew;
                            else if (meterTypeFilter === 'circ') displayVal = uCirc;

                            rowTotal += displayVal;

                            return (
                              <td key={u.key} className="py-1.5 px-0.5 text-center font-mono border-r border-slate-100 text-[11px]">
                                {displayVal > 0 ? (
                                  <span className="font-bold text-slate-900">{displayVal.toLocaleString()}</span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Cột Tổng Cộng bên phải */}
                          <td className="py-2 px-2 text-right font-mono font-black text-slate-900 bg-brand-50/50 sticky right-0 z-10 text-[11px]">
                            {rowTotal > 0 ? (
                              <span className="text-brand-900 font-extrabold">{rowTotal.toLocaleString()}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Hàng Tổng Đơn Vị (Footer) */}
                  <tfoot className="bg-slate-100/95 font-extrabold border-t-2 border-slate-300 sticky bottom-0 text-[11px] text-slate-800 z-20 shadow-xs">
                    <tr>
                      <td className="py-2.5 px-2 border-r border-slate-200 sticky left-0 bg-slate-100 z-30 uppercase tracking-wider text-brand-900 font-black">
                        TỔNG ĐƠN VỊ
                      </td>
                      <td className="py-2.5 px-1 text-center border-r border-slate-200 text-slate-500 text-[10px]">
                        Cái
                      </td>
                      {colTotals.map((c, cIdx) => (
                        <td key={cIdx} className="py-2 px-0.5 text-center font-mono border-r border-slate-200 text-brand-950 font-black text-[11px]">
                          {c.total > 0 ? (
                            <span>{c.total.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-300 font-normal">-</span>
                          )}
                        </td>
                      ))}
                      <td className="py-2.5 px-2 text-right font-mono font-black text-brand-900 bg-brand-100/90 sticky right-0 z-30 text-xs">
                        <span>{grandTotal.toLocaleString()}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Ghi chú viết tắt 12 đơn vị */}
              <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-brand-600" />
                    Ký hiệu viết tắt 12 đơn vị:
                  </span>
                  <span><strong className="text-brand-700 font-mono">TP1</strong>: XNCN Số 1</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-brand-700 font-mono">TP2</strong>: XNCN Số 2</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-brand-700 font-mono">MS</strong>: Mai Sơn</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-brand-700 font-mono">MC</strong>: Mộc Châu</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-brand-700 font-mono">YC</strong>: Yên Châu</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-brand-700 font-mono">BY</strong>: Bắc Yên</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-brand-700 font-mono">TC</strong>: Thuận Châu</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-brand-700 font-mono">PY</strong>: Phù Yên</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-brand-700 font-mono">ML</strong>: Mường La</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-brand-700 font-mono">SM</strong>: Sông Mã</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-brand-700 font-mono">SC</strong>: Sốp Cộp</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-brand-700 font-mono">QN</strong>: Quỳnh Nhai</span>
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  * Rê chuột vào từng cột mã viết tắt để xem tên đầy đủ đơn vị
                </div>
              </div>

              {/* Printable Signatures Block */}
              <div className="hidden print:grid grid-cols-3 text-center text-xs text-slate-900 pt-8 pb-4 break-inside-avoid px-6 border-t border-slate-200">
                <div>
                  <p className="font-bold uppercase">TRƯỞNG PHÒNG</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">Phạm Phương Đông</div>
                </div>
                <div>
                  <p className="font-bold uppercase">PHỤ TRÁCH XƯỞNG</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">Bùi Đức Duy</div>
                </div>
                <div>
                  <p className="italic text-slate-600 mb-0.5">Sơn La, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {selectedYear}</p>
                  <p className="font-bold uppercase">NGƯỜI LẬP BIỂU</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">{currentUser?.fullName || 'Đồng Đức Anh'}</div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: DẠNG THẺ SỔ KHO 12 ĐƠN VỊ (CARDS VIEW) */}
          {displayMode === 'cards' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Sổ chi tiết xuất theo từng chi nhánh / xí nghiệp (tháng)</span>
                <span className="font-semibold text-brand-700">
                  Kỳ: {selectedMonth === 'all' ? `Cả Năm ${selectedYear}` : `${selectedMonth} / Năm ${selectedYear}`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {unitHeaders.map((u, idx) => {
                  let unitTotalNew = 0;
                  let unitTotalCirc = 0;
                  const activeMeters: any[] = [];

                  u.meters.forEach((pm: any) => {
                    let n = 0;
                    let c = 0;
                    if (selectedMonth === 'all') {
                      n = pm.year_total?.new || 0;
                      c = pm.year_total?.circ || 0;
                    } else {
                      const mData = pm.months?.[selectedMonth];
                      n = mData?.new || 0;
                      c = mData?.circ || 0;
                    }

                    if (n > 0 || c > 0) {
                      unitTotalNew += n;
                      unitTotalCirc += c;
                      activeMeters.push({
                        name: pm.name,
                        unit: pm.unit,
                        newQty: n,
                        circQty: c,
                        total: n + c,
                      });
                    }
                  });

                  const grand = unitTotalNew + unitTotalCirc;

                  return (
                    <div
                      key={u.key}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:border-brand-300 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Đơn Vị #{idx + 1}
                            </span>
                            <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                              {u.fullName}
                            </h4>
                          </div>

                          <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-black font-mono">
                            {grand.toLocaleString()} cái
                          </span>
                        </div>

                        {/* Breakdown bar */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                            <span className="text-[10px] text-blue-600 block font-semibold">ĐH Mới</span>
                            <span className="font-mono font-bold text-sm">{unitTotalNew.toLocaleString()} cái</span>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                            <span className="text-[10px] text-emerald-600 block font-semibold">ĐH Xưởng Sửa</span>
                            <span className="font-mono font-bold text-sm">{unitTotalCirc.toLocaleString()} cái</span>
                          </div>
                        </div>

                        {/* Meter list table */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Các loại đồng hồ đã nhận ({activeMeters.length} loại):
                          </span>

                          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                            {activeMeters.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2">Chưa phát sinh xuất kho kỳ này.</p>
                            ) : (
                              activeMeters.map((m, mIdx) => (
                                <div
                                  key={mIdx}
                                  className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-slate-50 text-xs border border-slate-100"
                                >
                                  <span className="font-medium text-slate-800 truncate max-w-[170px]" title={m.name}>
                                    {m.name}
                                  </span>

                                  <div className="text-right font-mono text-[11px] flex-shrink-0">
                                    <span className="font-bold text-slate-900">{m.total}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE 3: TIẾN ĐỘ XUẤT 12 THÁNG CHO TỪNG LOẠI ĐỒNG HỒ & KẾ HOẠCH NĂM (TIMELINE VIEW) */}
          {displayMode === 'timeline' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs print:hidden">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-indigo-600" />
                    Bảng Tiến Độ Xuất Kho Theo 12 Tháng &amp; Kế Hoạch Năm
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Theo dõi tiến độ xuất theo 12 đơn vị năm {selectedYear}: tự động tính Tổng xuất, Kế hoạch xuất tháng và Chưa Thay
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Loại ĐH:</span>
                    <select
                      value={selectedProductCode}
                      onChange={(e) => setSelectedProductCode(e.target.value)}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-bold text-brand-700 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs"
                    >
                      <option value="all">★ Tất Cả Loại Đồng Hồ (Tổng Hợp)</option>
                      {productsList.map((p) => (
                        <option key={p.code} value={p.code}>
                          [{p.code}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoFillPlans}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-2xs"
                    title="Tự động điền Kế hoạch năm bằng số lượng đã xuất để đối soát nhanh"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Điền Nhanh KH</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearPlans}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all shadow-2xs"
                    title="Xóa toàn bộ số kế hoạch đã nhập của loại này"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Xóa KH</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportTimelineExcel(false)}
                    disabled={isExportingExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
                    title="Tải bảng tính Excel chuẩn mẫu Xưởng có sẵn công thức và chữ ký cán bộ"
                  >
                    {isExportingExcel ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    <span>Xuất Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-2xs"
                    title="In biểu mẫu hoặc lưu file PDF (A4 ngang)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In / Xuất PDF</span>
                  </button>

                  {planSaveStatus && (
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px] px-2 py-1 bg-emerald-100/70 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {planSaveStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Hướng dẫn ngắn */}
              <div className="px-4 py-2 bg-brand-50/40 border-b border-brand-100 text-[11px] text-slate-600 flex items-center gap-1.5 print:hidden">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Hướng dẫn:</strong> Nhập trực tiếp số lượng vào cột <strong className="text-emerald-700">Kế hoạch năm</strong>. Các cột <strong>T1→T12</strong> tự động gọi từ phiếu xuất, các cột <strong>Tổng xuất</strong>, <strong>Kế hoạch xuất tháng</strong> (KH năm / 12) và <strong className="text-rose-600">Chưa Thay</strong> (KH năm - Tổng xuất) được hệ thống tự động tính toán.
                </span>
              </div>

              {/* Printable Official Header (Only shows on print/PDF) */}
              <div className="hidden print:block px-4 pt-3 pb-2 border-b border-slate-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-700">Công ty cổ phần cấp nước Sơn La</p>
                    <p className="text-xs font-bold uppercase text-slate-900">XƯỞNG ĐỒNG HỒ NƯỚC</p>
                  </div>
                  <div className="text-right text-xs italic text-slate-500">
                    Ngày in: {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="text-center my-3">
                  <h2 className="text-base font-black uppercase text-slate-900">
                    BẢNG TIẾN ĐỘ XUẤT ĐỒNG HỒ 12 THÁNG NĂM {selectedYear}
                  </h2>
                  <p className="text-xs text-slate-600 italic mt-0.5">
                    Loại đồng hồ: {selectedProductCode === 'all' ? 'Tất cả các loại đồng hồ (Tổng hợp)' : (productsList.find((p: any) => p.code === selectedProductCode)?.name || selectedProductCode)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead className="bg-slate-100/95 text-slate-800 font-bold border-b border-slate-300 text-[11px] sticky top-0 z-20">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[170px] border border-slate-300 sticky left-0 bg-slate-100 z-30 text-left font-black text-slate-900 uppercase">
                        TÊN ĐƠN VỊ
                      </th>
                      {monthsList.map((m, idx) => (
                        <th key={m} className="py-2 px-1 text-center min-w-[42px] border border-slate-300 font-bold text-slate-800">
                          T{idx + 1}
                        </th>
                      ))}
                      <th className="py-2.5 px-2 text-right min-w-[80px] border border-slate-300 font-black text-slate-900 bg-slate-50">
                        Tổng xuất
                      </th>
                      <th className="py-2.5 px-2 text-right min-w-[100px] border border-slate-300 font-bold text-slate-800 bg-slate-50">
                        Kế hoạch xuất tháng
                      </th>
                      <th className="py-2.5 px-2 text-right min-w-[110px] border border-slate-300 font-black text-emerald-700 bg-emerald-50/70">
                        Kế hoạch năm
                      </th>
                      <th className="py-2.5 px-2 text-right min-w-[85px] border border-slate-300 font-black text-rose-600 bg-rose-50/70 sticky right-0 z-30">
                        Chưa Thay
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {unitHeaders.map((u) => {
                      const uMeters = u.meters || [];
                      let uTotalExport = 0;
                      const monthlyValues = monthsList.map((m) => {
                        let val = 0;
                        if (selectedProductCode === 'all') {
                          uMeters.forEach((meter: any) => {
                            const mData = meter.months?.[m];
                            val += mData?.total || ((mData?.new || 0) + (mData?.circ || 0));
                          });
                        } else {
                          const targetMeter = uMeters.find((meter: any) => meter.code === selectedProductCode || meter.name === selectedProductCode);
                          const mData = targetMeter?.months?.[m];
                          val = mData?.total || ((mData?.new || 0) + (mData?.circ || 0));
                        }
                        uTotalExport += val;
                        return val;
                      });

                      const planKey = `${selectedYear}_${selectedProductCode}_${u.key}`;
                      const planVal = yearlyPlans[planKey] !== undefined ? yearlyPlans[planKey] : 0;
                      const monthlyPlanVal = planVal > 0 ? Math.round(planVal / 12) : 0;
                      const chuaThayVal = planVal > 0 ? Math.max(0, planVal - uTotalExport) : 0;

                      return (
                        <tr key={u.key} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Tên Đơn Vị */}
                          <td className="py-2 px-3 font-bold text-slate-900 border border-slate-300 sticky left-0 bg-white z-10 whitespace-nowrap">
                            {formatUnitTimelineName(u.abbr, u.fullName)}
                          </td>

                          {/* 2-13. T1 -> T12 */}
                          {monthlyValues.map((val, mIdx) => (
                            <td key={mIdx} className="py-1.5 px-1 text-center font-mono border border-slate-300 text-[11px]">
                              {val > 0 ? (
                                <span className="font-bold text-slate-800">{val.toLocaleString()}</span>
                              ) : (
                                <span className="text-slate-300 font-normal">-</span>
                              )}
                            </td>
                          ))}

                          {/* 14. Tổng Xuất */}
                          <td className="py-2 px-2 text-right font-mono font-black text-slate-900 border border-slate-300 bg-slate-50/60">
                            {uTotalExport > 0 ? uTotalExport.toLocaleString() : '-'}
                          </td>

                          {/* 15. Kế Hoạch Xuất Tháng */}
                          <td className="py-2 px-2 text-right font-mono font-semibold text-slate-700 border border-slate-300">
                            {monthlyPlanVal > 0 ? monthlyPlanVal.toLocaleString() : '-'}
                          </td>

                          {/* 16. Kế Hoạch Năm (Tự điền giá trị) */}
                          <td className="py-1.5 px-1.5 text-right font-mono border border-slate-300 bg-emerald-50/20">
                            <span className="hidden print:inline font-mono font-black text-emerald-800 text-xs">
                              {planVal > 0 ? planVal.toLocaleString() : '-'}
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={yearlyPlans[planKey] !== undefined ? yearlyPlans[planKey] : ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                                handlePlanChange(planKey, val);
                              }}
                              className="w-20 sm:w-24 text-right font-mono font-black text-xs py-1 px-1.5 border border-emerald-300 bg-white rounded focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400 outline-none text-emerald-800 shadow-2xs print:hidden"
                              title="Nhập số kế hoạch năm để tự động tính KH tháng và Chưa thay"
                            />
                          </td>

                          {/* 17. Chưa Thay */}
                          <td className="py-2 px-2 text-right font-mono border border-slate-300 bg-rose-50/30 sticky right-0 z-10">
                            {planVal > 0 ? (
                              chuaThayVal > 0 ? (
                                <span className="font-black text-rose-600 text-xs">{chuaThayVal.toLocaleString()}</span>
                              ) : (
                                <span className="font-bold text-emerald-700 text-xs">0 (Đạt)</span>
                              )
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Hàng TỔNG CỘNG Footer */}
                  <tfoot className="bg-slate-100/95 font-extrabold border-t-2 border-slate-400 sticky bottom-0 text-[11px] text-slate-900 z-20 shadow-xs">
                    <tr>
                      <td className="py-2.5 px-3 border border-slate-300 sticky left-0 bg-slate-100 z-30 uppercase font-black text-slate-900">
                        TỔNG CỘNG
                      </td>
                      {monthsList.map((m) => {
                        const mTotal = unitHeaders.reduce((sum, u) => {
                          let val = 0;
                          if (selectedProductCode === 'all') {
                            (u.meters || []).forEach((meter: any) => {
                              const mData = meter.months?.[m];
                              val += mData?.total || ((mData?.new || 0) + (mData?.circ || 0));
                            });
                          } else {
                            const targetMeter = (u.meters || []).find((meter: any) => meter.code === selectedProductCode || meter.name === selectedProductCode);
                            const mData = targetMeter?.months?.[m];
                            val = mData?.total || ((mData?.new || 0) + (mData?.circ || 0));
                          }
                          return sum + val;
                        }, 0);

                        return (
                          <td key={m} className="py-2 px-1 text-center font-mono border border-slate-300 font-bold text-slate-800">
                            {mTotal > 0 ? mTotal.toLocaleString() : '-'}
                          </td>
                        );
                      })}

                      {/* Tổng xuất toàn bộ */}
                      <td className="py-2 px-2 text-right font-mono font-black border border-slate-300 bg-slate-200/60 text-slate-900">
                        {unitHeaders.reduce((sum, u) => {
                          let total = 0;
                          if (selectedProductCode === 'all') {
                            (u.meters || []).forEach((meter: any) => {
                              monthsList.forEach((m) => {
                                const mData = meter.months?.[m];
                                total += mData?.total || ((mData?.new || 0) + (mData?.circ || 0));
                              });
                            });
                          } else {
                            const targetMeter = (u.meters || []).find((meter: any) => meter.code === selectedProductCode || meter.name === selectedProductCode);
                            monthsList.forEach((m) => {
                              const mData = targetMeter?.months?.[m];
                              total += mData?.total || ((mData?.new || 0) + (mData?.circ || 0));
                            });
                          }
                          return sum + total;
                        }, 0).toLocaleString()}
                      </td>

                      {/* Kế hoạch xuất tháng toàn bộ */}
                      <td className="py-2 px-2 text-right font-mono font-bold border border-slate-300 text-slate-800">
                        {(() => {
                          const grandPlan = unitHeaders.reduce((sum, u) => {
                            const planKey = `${selectedYear}_${selectedProductCode}_${u.key}`;
                            return sum + (yearlyPlans[planKey] || 0);
                          }, 0);
                          return grandPlan > 0 ? Math.round(grandPlan / 12).toLocaleString() : '-';
                        })()}
                      </td>

                      {/* Kế hoạch năm toàn bộ */}
                      <td className="py-2 px-2 text-right font-mono font-black border border-slate-300 text-emerald-800 bg-emerald-100/70">
                        {(() => {
                          const grandPlan = unitHeaders.reduce((sum, u) => {
                            const planKey = `${selectedYear}_${selectedProductCode}_${u.key}`;
                            return sum + (yearlyPlans[planKey] || 0);
                          }, 0);
                          return grandPlan > 0 ? grandPlan.toLocaleString() : '-';
                        })()}
                      </td>

                      {/* Chưa thay toàn bộ */}
                      <td className="py-2.5 px-2 text-right font-mono font-black text-rose-600 bg-rose-100/70 sticky right-0 z-30">
                        {(() => {
                          const grandChuaThay = unitHeaders.reduce((sum, u) => {
                            const planKey = `${selectedYear}_${selectedProductCode}_${u.key}`;
                            const plan = yearlyPlans[planKey] || 0;
                            if (!plan) return sum;
                            let total = 0;
                            if (selectedProductCode === 'all') {
                              (u.meters || []).forEach((meter: any) => {
                                monthsList.forEach((m) => {
                                  const mData = meter.months?.[m];
                                  total += mData?.total || ((mData?.new || 0) + (mData?.circ || 0));
                                });
                              });
                            } else {
                              const targetMeter = (u.meters || []).find((meter: any) => meter.code === selectedProductCode || meter.name === selectedProductCode);
                              monthsList.forEach((m) => {
                                const mData = targetMeter?.months?.[m];
                                total += mData?.total || ((mData?.new || 0) + (mData?.circ || 0));
                              });
                            }
                            return sum + Math.max(0, plan - total);
                          }, 0);
                          return grandChuaThay > 0 ? grandChuaThay.toLocaleString() : '0';
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Printable Signatures Block */}
              <div className="hidden print:grid grid-cols-3 text-center text-xs text-slate-900 pt-8 pb-4 break-inside-avoid px-6">
                <div>
                  <p className="font-bold uppercase">TRƯỞNG PHÒNG</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">Phạm Phương Đông</div>
                </div>
                <div>
                  <p className="font-bold uppercase">PHỤ TRÁCH XƯỞNG</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">Bùi Đức Duy</div>
                </div>
                <div>
                  <p className="italic text-slate-600 mb-0.5">Sơn La, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {selectedYear}</p>
                  <p className="font-bold uppercase">NGƯỜI LẬP BIỂU</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">{currentUser?.fullName || 'Đồng Đức Anh'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'usedMeters' && (
        <div className="space-y-6">
          {/* Top Control Bar with View Mode Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Mode Switcher Buttons */}
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Chọn Cách Trình Bày:
                </span>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
                  <button
                    onClick={() => setDisplayMode('timeline')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      displayMode === 'timeline'
                        ? 'bg-white text-brand-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LineChart className="w-4 h-4 text-indigo-600" />
                    Tiến Độ Chuyển Về 12 Tháng
                  </button>

                  <button
                    onClick={() => setDisplayMode('matrix')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      displayMode === 'matrix'
                        ? 'bg-white text-brand-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table2 className="w-4 h-4 text-brand-600" />
                    Tổng Hợp Nhận ĐH Cũ (12 ĐV)
                  </button>

                  <button
                    onClick={() => setDisplayMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      displayMode === 'cards'
                        ? 'bg-white text-brand-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 text-emerald-600" />
                    Sổ chi tiết nhập (tháng)
                  </button>
                </div>
              </div>

              {/* Filters for Year & Month */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Năm:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white font-black text-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        Năm {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Thời Gian:
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white font-bold text-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs"
                  >
                    <option value="all">Tổng Hợp Cả Năm {selectedYear}</option>
                    {monthsList.map((m) => (
                      <option key={m} value={m}>
                        {m} ({selectedYear})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* MODE 1: MATRIX TABLE (GIỐNG TỔNG HỢP XUẤT KHO THEO LOẠI ĐỒNG HỒ - B1) */}
          {displayMode === 'matrix' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-amber-600" />
                    Tổng hợp nhập kho đồng hồ cũ theo loại đồng hồ
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kỳ: <strong className="text-brand-700">{selectedMonth === 'all' ? `Cả Năm ${selectedYear}` : `${selectedMonth} / Năm ${selectedYear}`}</strong> | 
                    Nguồn: <strong className="text-amber-700">Đồng hồ cũ từ 12 đơn vị gửi về xưởng để sửa chữa</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  {/* Switch chế độ hiển thị: Gọn (Chuẩn B1) / Đầy Đủ Chi Tiết Xưởng */}
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                    <button
                      onClick={() => setUsedViewDetail(false)}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        !usedViewDetail
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Chuẩn B1 (12 Đơn Vị)
                    </button>
                    <button
                      onClick={() => setUsedViewDetail(true)}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        usedViewDetail
                          ? 'bg-amber-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Kèm Đối Soát Sửa Chữa
                    </button>
                  </div>

                  {/* Nút chuyển đổi Chế độ Co dãn vừa khung màn hình / Cuộn ngang */}
                  <button
                    onClick={() => setFitMode(!fitMode)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      fitMode
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title={fitMode ? "Đang bật chế độ tự động co dãn vừa vặn khung hình" : "Đang bật chế độ cuộn ngang tự do"}
                  >
                    <span className={`w-2 h-2 rounded-full ${fitMode ? 'bg-amber-600' : 'bg-slate-400'}`}></span>
                    <span>{fitMode ? 'Co Dãn (100%)' : 'Cuộn Ngang'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportMatrixExcel(true)}
                    disabled={isExportingExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
                    title="Tải bảng tính Excel tổng hợp thu hồi 12 đơn vị"
                  >
                    {isExportingExcel ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    <span>Xuất Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-2xs"
                    title="In biểu mẫu hoặc lưu file PDF (A4 ngang)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In / Xuất PDF</span>
                  </button>
                </div>
              </div>

              {/* Printable Official Header (Only shows on print/PDF) */}
              <div className="hidden print:block px-4 pt-3 pb-2 border-b border-slate-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-700">Công ty cổ phần cấp nước Sơn La</p>
                    <p className="text-xs font-bold uppercase text-slate-900">XƯỞNG ĐỒNG HỒ NƯỚC</p>
                  </div>
                  <div className="text-right text-xs italic text-slate-500">
                    Ngày in: {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="text-center my-3">
                  <h2 className="text-base font-black uppercase text-slate-900">
                    BẢNG TỔNG HỢP NHẬP KHO ĐỒNG HỒ CŨ 12 ĐƠN VỊ NĂM {selectedYear}
                  </h2>
                  <p className="text-xs text-slate-600 italic mt-0.5">
                    Kỳ: {selectedMonth === 'all' ? `Cả Năm ${selectedYear}` : `${selectedMonth} / Năm ${selectedYear}`} | Nguồn: Đồng hồ cũ thu hồi về sửa chữa
                  </p>
                </div>
              </div>

              <div className={fitMode && !usedViewDetail ? "w-full overflow-x-auto lg:overflow-x-hidden" : "overflow-x-auto max-w-full"}>
                <table className={`w-full text-left border-collapse ${fitMode && !usedViewDetail ? 'table-fixed text-[11px]' : 'text-xs min-w-[1050px]'}`}>
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] sticky top-0 z-20">
                    <tr>
                      <th className={`py-2.5 px-2 border-r border-slate-200 sticky left-0 bg-slate-100 z-30 font-bold text-slate-800 ${fitMode && !usedViewDetail ? 'w-[22%]' : 'min-w-[170px]'}`}>
                        Loại Đồng Hồ
                      </th>
                      <th className={`py-2.5 px-1 text-center border-r border-slate-200 text-slate-600 ${fitMode && !usedViewDetail ? 'w-[4%]' : 'w-10'}`}>
                        ĐVT
                      </th>
                      {usedUnitHeaders.map((u) => (
                        <th 
                          key={u.key} 
                          title={`${u.abbr} - ${u.fullName} (Rê chuột xem tên chi nhánh)`}
                          className={`py-2 px-1 text-center border-r border-slate-200 cursor-help hover:bg-amber-100/70 transition-colors ${
                            fitMode && !usedViewDetail ? 'w-[5.35%]' : 'min-w-[50px]'
                          }`}
                        >
                          <span className="font-mono font-black text-amber-800 text-[11px] block">
                            {u.abbr}
                          </span>
                        </th>
                      ))}
                      <th className={`py-2.5 px-2 text-right bg-amber-50 text-amber-900 font-black border-r border-slate-200 ${!usedViewDetail ? 'sticky right-0 z-30' : ''} ${fitMode && !usedViewDetail ? 'w-[9.8%]' : 'min-w-[85px]'}`}>
                        {usedViewDetail ? 'Tổng Nhận' : 'TỔNG CỘNG'}
                      </th>
                      {usedViewDetail && (
                        <>
                          <th className="py-2.5 px-2 text-right bg-emerald-50 text-emerald-800 font-bold border-r border-slate-200 min-w-[75px]">
                            Đã Sửa
                          </th>
                          <th className="py-2.5 px-2 text-right bg-rose-50 text-rose-700 font-bold border-r border-slate-200 min-w-[70px]">
                            Hỏng Bỏ
                          </th>
                          <th className="py-2.5 px-2 text-right bg-amber-100 text-amber-950 font-black border-r border-slate-200 min-w-[90px]">
                            Tồn Chờ Sửa
                          </th>
                          <th className="py-2.5 px-2 text-center bg-slate-100 text-slate-700 font-bold sticky right-0 z-30 min-w-[85px]">
                            Thao Tác
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {usedProductsList.map((prod: any, idx: number) => {
                      const summary = usedMetersSummary.find((s: any) => s.code === prod.code || s.name === prod.name) || {
                        totalReceived: 0,
                        totalRepaired: 0,
                        totalScrapped: 0,
                        endingWaitingRepair: 0,
                      };

                      let rowTotalReceived = 0;
                      const unitVals = usedUnitHeaders.map((u) => {
                        const uMeter = u.meters.find((m: any) => m.code === prod.code || m.name === prod.name);
                        let val = 0;
                        if (uMeter) {
                          if (selectedMonth === 'all') val = uMeter.year_total?.total || 0;
                          else val = uMeter.months?.[selectedMonth]?.total || 0;
                        }
                        rowTotalReceived += val;
                        return val;
                      });

                      const waitingStock = selectedMonth === 'all' 
                        ? summary.endingWaitingRepair 
                        : Math.max(0, rowTotalReceived - summary.totalRepaired - summary.totalScrapped);

                      return (
                        <tr key={prod.code || idx} className="hover:bg-amber-50/50 transition-colors">
                          {/* Tên loại đồng hồ */}
                          <td 
                            className={`py-2 px-2 font-semibold text-slate-900 border-r border-slate-200 sticky left-0 bg-white z-10 shadow-2xs ${fitMode && !usedViewDetail ? 'truncate' : ''}`}
                            title={prod.name}
                          >
                            <span className="block text-slate-900 truncate font-semibold">{prod.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 block leading-none">{prod.code}</span>
                          </td>

                          <td className="py-2 px-1 text-center text-slate-500 border-r border-slate-200 text-[10px]">
                            {prod.unit || 'Cái'}
                          </td>

                          {/* 12 Cột Đơn Vị (TP1, TP2, MS, MC, YC, BY, TC, PY, ML, SM, SC, QN) */}
                          {unitVals.map((val, uIdx) => (
                            <td key={uIdx} className="py-1.5 px-0.5 text-center font-mono border-r border-slate-100 text-[11px]">
                              {val > 0 ? (
                                <span className="font-bold text-slate-900">{val.toLocaleString()}</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          ))}

                          {/* Cột Tổng Cộng bên phải */}
                          <td className={`py-2 px-2 text-right font-mono font-black text-slate-900 bg-amber-50/50 border-r border-slate-200 text-[11px] ${!usedViewDetail ? 'sticky right-0 z-10' : ''}`}>
                            {rowTotalReceived > 0 ? (
                              <span className="text-amber-900 font-extrabold">{rowTotalReceived.toLocaleString()}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Các cột chi tiết xưởng nếu bật */}
                          {usedViewDetail && (
                            <>
                              <td className="py-2 px-2 text-right font-mono font-semibold text-emerald-700 bg-emerald-50/30 border-r border-slate-200 text-[11px]">
                                {summary.totalRepaired > 0 ? summary.totalRepaired.toLocaleString() : '-'}
                              </td>

                              <td className="py-2 px-2 text-right font-mono text-rose-600 bg-rose-50/30 border-r border-slate-200 text-[11px]">
                                {summary.totalScrapped > 0 ? summary.totalScrapped.toLocaleString() : '-'}
                              </td>

                              <td className="py-2 px-2 text-right font-mono font-black bg-amber-50/60 border-r border-slate-200 text-[11px]">
                                {waitingStock > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold shadow-2xs">
                                    {waitingStock.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-light">0</span>
                                )}
                              </td>

                              <td className="py-2 px-2 text-center bg-white sticky right-0 z-10 border-l border-slate-100">
                                <a
                                  href={`/repairs?meterCode=${encodeURIComponent(prod.code)}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition-all shadow-2xs"
                                  title="Mở phiếu sửa chữa cho loại đồng hồ này"
                                >
                                  <Wrench className="w-3 h-3 text-amber-600" />
                                  <span>Sửa Chữa</span>
                                </a>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Hàng Tổng Đơn Vị (Footer) */}
                  <tfoot className="bg-slate-100/95 font-extrabold border-t-2 border-slate-300 sticky bottom-0 text-[11px] text-slate-800 z-20 shadow-xs">
                    <tr>
                      <td className="py-2.5 px-2 border-r border-slate-200 sticky left-0 bg-slate-100 z-30 uppercase tracking-wider text-amber-900 font-black">
                        TỔNG ĐƠN VỊ
                      </td>
                      <td className="py-2.5 px-1 text-center border-r border-slate-200 text-slate-500 text-[10px]">
                        Cái
                      </td>
                      {usedColTotals.map((tot, cIdx) => (
                        <td key={cIdx} className="py-2 px-0.5 text-center font-mono border-r border-slate-200 text-amber-950 font-black text-[11px]">
                          {tot > 0 ? tot.toLocaleString() : <span className="text-slate-300 font-normal">-</span>}
                        </td>
                      ))}
                      <td className={`py-2.5 px-2 text-right font-mono font-black text-amber-900 bg-amber-100/90 text-xs border-r border-slate-200 ${!usedViewDetail ? 'sticky right-0 z-30' : ''}`}>
                        {grandTotalUsedReceived.toLocaleString()}
                      </td>
                      {usedViewDetail && (
                        <>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-800 bg-emerald-100/70 border-r border-slate-200 text-xs">
                            {grandTotalRepaired.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-800 bg-rose-100/70 border-r border-slate-200 text-xs">
                            {grandTotalScrapped.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-black text-amber-900 bg-amber-200/80 border-r border-slate-200 text-xs">
                            {grandTotalWaitingRepair.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-center bg-slate-100 sticky right-0 z-30 text-[10px] text-slate-500 font-bold border-l border-slate-200">
                            Xưởng SOWASUCO
                          </td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Ghi chú viết tắt 12 đơn vị */}
              <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    Ký hiệu viết tắt 12 đơn vị:
                  </span>
                  <span><strong className="text-amber-700 font-mono">TP1</strong>: XNCN Số 1</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-amber-700 font-mono">TP2</strong>: XNCN Số 2</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-amber-700 font-mono">MS</strong>: Mai Sơn</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-amber-700 font-mono">MC</strong>: Mộc Châu</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-amber-700 font-mono">YC</strong>: Yên Châu</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-amber-700 font-mono">BY</strong>: Bắc Yên</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-amber-700 font-mono">TC</strong>: Thuận Châu</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-amber-700 font-mono">PY</strong>: Phù Yên</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-amber-700 font-mono">ML</strong>: Mường La</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-amber-700 font-mono">SM</strong>: Sông Mã</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-amber-700 font-mono">SC</strong>: Sốp Cộp</span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-amber-700 font-mono">QN</strong>: Quỳnh Nhai</span>
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  * Rê chuột vào từng cột mã viết tắt để xem tên đầy đủ đơn vị
                </div>
              </div>

              {/* Printable Signatures Block */}
              <div className="hidden print:grid grid-cols-3 text-center text-xs text-slate-900 pt-8 pb-4 break-inside-avoid px-6 border-t border-slate-200">
                <div>
                  <p className="font-bold uppercase">TRƯỞNG PHÒNG</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">Phạm Phương Đông</div>
                </div>
                <div>
                  <p className="font-bold uppercase">PHỤ TRÁCH XƯỞNG</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">Bùi Đức Duy</div>
                </div>
                <div>
                  <p className="italic text-slate-600 mb-0.5">Sơn La, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {selectedYear}</p>
                  <p className="font-bold uppercase">NGƯỜI LẬP BIỂU</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">{currentUser?.fullName || 'Đồng Đức Anh'}</div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: CARDS VIEW */}
          {displayMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {usedUnitHeaders.map((u, idx) => {
                let unitTotal = 0;
                const activeMeters = u.meters
                  .map((m: any) => {
                    const count = selectedMonth === 'all' ? (m.year_total?.total || 0) : (m.months?.[selectedMonth]?.total || 0);
                    unitTotal += count;
                    return { ...m, currentCount: count };
                  })
                  .filter((m: any) => m.currentCount > 0);

                return (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <h4 className="font-bold text-slate-900 text-sm">{u.fullName}</h4>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">Mã: {u.abbr}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Tổng chuyển về:</span>
                        <span className="text-lg font-black text-amber-700">{unitTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {activeMeters.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        Chưa có đồng hồ cũ chuyển về trong đợt này.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                        {activeMeters.map((m: any, mIdx: number) => (
                          <div key={mIdx} className="flex justify-between items-center py-1 px-2 rounded bg-slate-50">
                            <span className="font-medium text-slate-700 truncate pr-2">{m.name}</span>
                            <span className="font-bold text-slate-900 font-mono">{m.currentCount} cái</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* MODE 3: TIẾN ĐỘ CHUYỂN VỀ 12 THÁNG CHO TỪNG LOẠI ĐỒNG HỒ & KẾ HOẠCH NĂM (TIMELINE VIEW) */}
          {displayMode === 'timeline' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs print:hidden">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-amber-600" />
                    Bảng Tiến Độ Chuyển Đồng Hồ Cũ Về Xưởng Theo 12 Tháng &amp; Kế Hoạch Năm
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Theo dõi tiến độ chuyển về từ 12 đơn vị năm {selectedYear}: tự động tính Tổng chuyển về, Kế hoạch nhận tháng và Chưa Chuyển
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Loại ĐH:</span>
                    <select
                      value={selectedUsedProductCode}
                      onChange={(e) => setSelectedUsedProductCode(e.target.value)}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-bold text-amber-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                    >
                      <option value="all">★ Tất Cả Loại Đồng Hồ Cũ (Tổng Hợp)</option>
                      {usedProductsList.map((p: any) => (
                        <option key={p.code} value={p.code}>
                          [{p.code}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoFillUsedPlans}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-2xs"
                    title="Tự động điền Kế hoạch năm bằng số lượng đã chuyển về để đối soát nhanh"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Điền Nhanh KH</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearUsedPlans}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all shadow-2xs"
                    title="Xóa toàn bộ số kế hoạch đã nhập của loại này"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Xóa KH</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportTimelineExcel(true)}
                    disabled={isExportingExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
                    title="Tải bảng tính Excel chuẩn mẫu Xưởng có sẵn công thức và chữ ký cán bộ"
                  >
                    {isExportingExcel ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    <span>Xuất Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-2xs"
                    title="In biểu mẫu hoặc lưu file PDF (A4 ngang)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In / Xuất PDF</span>
                  </button>

                  {usedPlanSaveStatus && (
                    <span className="text-amber-800 font-bold flex items-center gap-1 text-[11px] px-2 py-1 bg-amber-100/70 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {usedPlanSaveStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Hướng dẫn ngắn */}
              <div className="px-4 py-2 bg-amber-50/40 border-b border-amber-100 text-[11px] text-slate-600 flex items-center gap-1.5 print:hidden">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Hướng dẫn:</strong> Nhập trực tiếp số lượng vào cột <strong className="text-emerald-700">Kế hoạch năm</strong>. Các cột <strong>T1→T12</strong> tự động gọi từ phiếu nhập ĐH cũ, các cột <strong>Tổng chuyển về</strong>, <strong>Kế hoạch nhận tháng</strong> (KH năm / 12) và <strong className="text-rose-600">Chưa Chuyển</strong> (KH năm - Tổng chuyển về) được hệ thống tự động tính toán.
                </span>
              </div>

              {/* Printable Official Header (Only shows on print/PDF) */}
              <div className="hidden print:block px-4 pt-3 pb-2 border-b border-slate-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-700">Công ty cổ phần cấp nước Sơn La</p>
                    <p className="text-xs font-bold uppercase text-slate-900">XƯỞNG ĐỒNG HỒ NƯỚC</p>
                  </div>
                  <div className="text-right text-xs italic text-slate-500">
                    Ngày in: {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="text-center my-3">
                  <h2 className="text-base font-black uppercase text-slate-900">
                    BẢNG TIẾN ĐỘ THU HỒI ĐỒNG HỒ CŨ 12 THÁNG NĂM {selectedYear}
                  </h2>
                  <p className="text-xs text-slate-600 italic mt-0.5">
                    Loại đồng hồ: {selectedUsedProductCode === 'all' ? 'Tất cả loại đồng hồ cũ (Tổng hợp)' : (usedProductsList.find((p: any) => p.code === selectedUsedProductCode)?.name || selectedUsedProductCode)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead className="bg-slate-100/95 text-slate-800 font-bold border-b border-slate-300 text-[11px] sticky top-0 z-20">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[170px] border border-slate-300 sticky left-0 bg-slate-100 z-30 text-left font-black text-slate-900 uppercase">
                        TÊN ĐƠN VỊ
                      </th>
                      {monthsList.map((m, idx) => (
                        <th key={m} className="py-2 px-1 text-center min-w-[42px] border border-slate-300 font-bold text-slate-800">
                          T{idx + 1}
                        </th>
                      ))}
                      <th className="py-2.5 px-2 text-right min-w-[80px] border border-slate-300 font-black text-slate-900 bg-slate-50">
                        Tổng chuyển về
                      </th>
                      <th className="py-2.5 px-2 text-right min-w-[100px] border border-slate-300 font-bold text-slate-800 bg-slate-50">
                        Kế hoạch nhận tháng
                      </th>
                      <th className="py-2.5 px-2 text-right min-w-[110px] border border-slate-300 font-black text-emerald-700 bg-emerald-50/70">
                        Kế hoạch năm
                      </th>
                      <th className="py-2.5 px-2 text-right min-w-[85px] border border-slate-300 font-black text-rose-600 bg-rose-50/70 sticky right-0 z-30">
                        Chưa Chuyển
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {usedUnitHeaders.map((u) => {
                      const uMeters = u.meters || [];
                      let uTotalReceived = 0;
                      const monthlyValues = monthsList.map((m) => {
                        let val = 0;
                        if (selectedUsedProductCode === 'all') {
                          uMeters.forEach((meter: any) => {
                            const mData = meter.months?.[m];
                            val += mData?.total || 0;
                          });
                        } else {
                          const targetMeter = uMeters.find((meter: any) => meter.code === selectedUsedProductCode || meter.name === selectedUsedProductCode);
                          const mData = targetMeter?.months?.[m];
                          val = mData?.total || 0;
                        }
                        uTotalReceived += val;
                        return val;
                      });

                      const planKey = `${selectedYear}_${selectedUsedProductCode}_${u.key}`;
                      const planVal = usedYearlyPlans[planKey] !== undefined ? usedYearlyPlans[planKey] : 0;
                      const monthlyPlanVal = planVal > 0 ? Math.round(planVal / 12) : 0;
                      const chuaChuyenVal = planVal > 0 ? Math.max(0, planVal - uTotalReceived) : 0;

                      return (
                        <tr key={u.key} className="hover:bg-amber-50/30 transition-colors">
                          {/* 1. Tên Đơn Vị */}
                          <td className="py-2 px-3 font-bold text-slate-900 border border-slate-300 sticky left-0 bg-white z-10 whitespace-nowrap">
                            {formatUnitTimelineName(u.abbr, u.fullName)}
                          </td>

                          {/* 2-13. T1 -> T12 */}
                          {monthlyValues.map((val, mIdx) => (
                            <td key={mIdx} className="py-1.5 px-1 text-center font-mono border border-slate-300 text-[11px]">
                              {val > 0 ? (
                                <span className="font-bold text-slate-800">{val.toLocaleString()}</span>
                              ) : (
                                <span className="text-slate-300 font-normal">-</span>
                              )}
                            </td>
                          ))}

                          {/* 14. Tổng Chuyển Về */}
                          <td className="py-2 px-2 text-right font-mono font-black text-slate-900 border border-slate-300 bg-slate-50/60">
                            {uTotalReceived > 0 ? uTotalReceived.toLocaleString() : '-'}
                          </td>

                          {/* 15. Kế Hoạch Nhận Tháng */}
                          <td className="py-2 px-2 text-right font-mono font-semibold text-slate-700 border border-slate-300">
                            {monthlyPlanVal > 0 ? monthlyPlanVal.toLocaleString() : '-'}
                          </td>

                          {/* 16. Kế Hoạch Năm (Tự điền giá trị) */}
                          <td className="py-1.5 px-1.5 text-right font-mono border border-slate-300 bg-emerald-50/20">
                            <span className="hidden print:inline font-mono font-black text-emerald-800 text-xs">
                              {planVal > 0 ? planVal.toLocaleString() : '-'}
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={usedYearlyPlans[planKey] !== undefined ? usedYearlyPlans[planKey] : ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                                handleUsedPlanChange(planKey, val);
                              }}
                              className="w-20 sm:w-24 text-right font-mono font-black text-xs py-1 px-1.5 border border-emerald-300 bg-white rounded focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400 outline-none text-emerald-800 shadow-2xs print:hidden"
                              title="Nhập số kế hoạch thu hồi năm để tự động tính KH tháng và Chưa chuyển"
                            />
                          </td>

                          {/* 17. Chưa Chuyển */}
                          <td className="py-2 px-2 text-right font-mono border border-slate-300 bg-rose-50/30 sticky right-0 z-10">
                            {planVal > 0 ? (
                              chuaChuyenVal > 0 ? (
                                <span className="font-black text-rose-600 text-xs">{chuaChuyenVal.toLocaleString()}</span>
                              ) : (
                                <span className="font-bold text-emerald-700 text-xs">0 (Đạt)</span>
                              )
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Hàng TỔNG CỘNG Footer */}
                  <tfoot className="bg-slate-100/95 font-extrabold border-t-2 border-slate-400 sticky bottom-0 text-[11px] text-slate-900 z-20 shadow-xs">
                    <tr>
                      <td className="py-2.5 px-3 border border-slate-300 sticky left-0 bg-slate-100 z-30 uppercase font-black text-slate-900">
                        TỔNG CỘNG
                      </td>
                      {monthsList.map((m) => {
                        const mTotal = usedUnitHeaders.reduce((sum, u) => {
                          let val = 0;
                          if (selectedUsedProductCode === 'all') {
                            (u.meters || []).forEach((meter: any) => {
                              const mData = meter.months?.[m];
                              val += mData?.total || 0;
                            });
                          } else {
                            const targetMeter = (u.meters || []).find((meter: any) => meter.code === selectedUsedProductCode || meter.name === selectedUsedProductCode);
                            const mData = targetMeter?.months?.[m];
                            val = mData?.total || 0;
                          }
                          return sum + val;
                        }, 0);

                        return (
                          <td key={m} className="py-2 px-1 text-center font-mono border border-slate-300 font-bold text-slate-800">
                            {mTotal > 0 ? mTotal.toLocaleString() : '-'}
                          </td>
                        );
                      })}

                      {/* Tổng chuyển về toàn bộ */}
                      <td className="py-2 px-2 text-right font-mono font-black border border-slate-300 bg-slate-200/60 text-slate-900">
                        {usedUnitHeaders.reduce((sum, u) => {
                          let total = 0;
                          if (selectedUsedProductCode === 'all') {
                            (u.meters || []).forEach((meter: any) => {
                              monthsList.forEach((m) => {
                                const mData = meter.months?.[m];
                                total += mData?.total || 0;
                              });
                            });
                          } else {
                            const targetMeter = (u.meters || []).find((meter: any) => meter.code === selectedUsedProductCode || meter.name === selectedUsedProductCode);
                            monthsList.forEach((m) => {
                              const mData = targetMeter?.months?.[m];
                              total += mData?.total || 0;
                            });
                          }
                          return sum + total;
                        }, 0).toLocaleString()}
                      </td>

                      {/* Kế hoạch nhận tháng toàn bộ */}
                      <td className="py-2 px-2 text-right font-mono font-bold border border-slate-300 text-slate-800">
                        {(() => {
                          const grandPlan = usedUnitHeaders.reduce((sum, u) => {
                            const planKey = `${selectedYear}_${selectedUsedProductCode}_${u.key}`;
                            return sum + (usedYearlyPlans[planKey] || 0);
                          }, 0);
                          return grandPlan > 0 ? Math.round(grandPlan / 12).toLocaleString() : '-';
                        })()}
                      </td>

                      {/* Kế hoạch năm toàn bộ */}
                      <td className="py-2 px-2 text-right font-mono font-black border border-slate-300 text-emerald-800 bg-emerald-100/70">
                        {(() => {
                          const grandPlan = usedUnitHeaders.reduce((sum, u) => {
                            const planKey = `${selectedYear}_${selectedUsedProductCode}_${u.key}`;
                            return sum + (usedYearlyPlans[planKey] || 0);
                          }, 0);
                          return grandPlan > 0 ? grandPlan.toLocaleString() : '-';
                        })()}
                      </td>

                      {/* Chưa chuyển toàn bộ */}
                      <td className="py-2.5 px-2 text-right font-mono font-black text-rose-600 bg-rose-100/70 sticky right-0 z-30">
                        {(() => {
                          const grandChuaChuyen = usedUnitHeaders.reduce((sum, u) => {
                            const planKey = `${selectedYear}_${selectedUsedProductCode}_${u.key}`;
                            const plan = usedYearlyPlans[planKey] || 0;
                            if (!plan) return sum;
                            let total = 0;
                            if (selectedUsedProductCode === 'all') {
                              (u.meters || []).forEach((meter: any) => {
                                monthsList.forEach((m) => {
                                  const mData = meter.months?.[m];
                                  total += mData?.total || 0;
                                });
                              });
                            } else {
                              const targetMeter = (u.meters || []).find((meter: any) => meter.code === selectedUsedProductCode || meter.name === selectedUsedProductCode);
                              monthsList.forEach((m) => {
                                const mData = targetMeter?.months?.[m];
                                total += mData?.total || 0;
                              });
                            }
                            return sum + Math.max(0, plan - total);
                          }, 0);
                          return grandChuaChuyen > 0 ? grandChuaChuyen.toLocaleString() : '0';
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Printable Signatures Block */}
              <div className="hidden print:grid grid-cols-3 text-center text-xs text-slate-900 pt-8 pb-4 break-inside-avoid px-6">
                <div>
                  <p className="font-bold uppercase">TRƯỞNG PHÒNG</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">Phạm Phương Đông</div>
                </div>
                <div>
                  <p className="font-bold uppercase">PHỤ TRÁCH XƯỞNG</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">Bùi Đức Duy</div>
                </div>
                <div>
                  <p className="italic text-slate-600 mb-0.5">Sơn La, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {selectedYear}</p>
                  <p className="font-bold uppercase">NGƯỜI LẬP BIỂU</p>
                  <p className="italic text-[11px] text-slate-500">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold">{currentUser?.fullName || 'Đồng Đức Anh'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
