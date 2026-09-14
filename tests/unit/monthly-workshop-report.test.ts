import { describe, it, expect } from 'vitest';
import { 
  STANDARD_UNIT_KEYS, 
  extractMeterDN, 
  DN_ORDER_MAP, 
  isRepairedMeter,
  mapUnitToStandardKey,
  MONTHS_LIST,
} from '../../src/services/reports.service';

describe('Monthly Workshop Export Report Logic', () => {
  it('should have 12 standardized units in the exact required order', () => {
    expect(STANDARD_UNIT_KEYS).toHaveLength(12);
    const expectedNames = [
      'XNCN Số 1',
      'XNCN Số 2',
      'XNCN Mai Sơn',
      'CNCN Mộc Châu',
      'CNCN Yên Châu',
      'CNCN Phù Yên',
      'CNCN Bắc Yên',
      'CNCN Sông Mã',
      'CNCN Sốp Cộp',
      'CNCN Thuận Châu',
      'CNCN Mường La',
      'CNCN Quỳnh Nhai',
    ];
    STANDARD_UNIT_KEYS.forEach((u, i) => {
      expect(u.name).toBe(expectedNames[i]);
    });
  });

  it('should extract correct DN size from code and name', () => {
    expect(extractMeterDN('ĐH015', 'Đồng hồ nước DN15')).toBe('DN15');
    expect(extractMeterDN('ĐH025', 'Đồng hồ DN25')).toBe('DN25');
    expect(extractMeterDN('ĐH032(SC)', 'Đồng hồ DN32 sửa chữa')).toBe('DN32');
    expect(extractMeterDN('ĐH040', 'Đồng hồ DN40')).toBe('DN40');
    expect(extractMeterDN('ĐH050', 'Đồng hồ DN50')).toBe('DN50');
    expect(extractMeterDN('ĐH080', 'Đồng hồ DN80')).toBe('DN80');
    expect(extractMeterDN('ĐH150-CTOR', 'Đồng hồ nước DN150 CONTOR-Metcon')).toBe('DN150');
    expect(extractMeterDN('ĐH200', 'Đồng hồ DN200')).toBe('DN200');
  });

  it('should correctly distinguish repaired vs new meters', () => {
    // Repaired indicators
    expect(isRepairedMeter({ code: 'ĐH015(SC)', name: 'ĐH DN15 (SC)', category: 'Sửa chữa' }, 'circulating')).toBe(true);
    expect(isRepairedMeter({ code: 'ĐH015(SC)', name: 'ĐH DN15 sửa chữa', category: 'Sửa chữa' }, undefined)).toBe(true);
    
    // New meters
    expect(isRepairedMeter({ code: 'ĐH015', name: 'Đồng hồ DN15 mới', category: 'Ngoại nhập' }, 'new')).toBe(false);
    expect(isRepairedMeter({ code: 'ĐH150-CTOR', name: 'Đồng hồ nước DN150 CONTOR-Metcon', category: 'Ngoại nhập' }, 'new')).toBe(false);
  });

  it('should sort DN sizes according to DN_ORDER_MAP', () => {
    const rawDNs = ['DN200', 'DN15', 'DN50', 'DN25', 'DN150', 'DN32'];
    const sorted = [...rawDNs].sort((a, b) => (DN_ORDER_MAP[a] || 999) - (DN_ORDER_MAP[b] || 999));
    expect(sorted).toEqual(['DN15', 'DN25', 'DN32', 'DN50', 'DN150', 'DN200']);
  });

  it('should dynamically filter columns when onlyActive is enabled', () => {
    // Simulate exported data for a month where only DN15 and DN25 were repaired, and DN15, DN40, DN150 were new
    const totalRepairedByDN: Record<string, number> = {
      DN15: 120,
      DN25: 15,
      DN32: 0,
      DN40: 0,
      DN50: 0,
    };
    const totalNewByDN: Record<string, number> = {
      DN15: 50,
      DN25: 0,
      DN32: 0,
      DN40: 10,
      DN50: 0,
      DN150: 2,
    };

    const sortDNs = (dns: string[]) => [...dns].sort((a, b) => (DN_ORDER_MAP[a] || 999) - (DN_ORDER_MAP[b] || 999));

    const actRep = Object.keys(totalRepairedByDN).filter(dn => totalRepairedByDN[dn] > 0);
    const actNew = Object.keys(totalNewByDN).filter(dn => totalNewByDN[dn] > 0);

    const repairedDNs = sortDNs(actRep);
    const newDNs = sortDNs(actNew);

    expect(repairedDNs).toEqual(['DN15', 'DN25']);
    expect(newDNs).toEqual(['DN15', 'DN40', 'DN150']);
  });

  it('should not show any empty columns when a category has zero exports in that month', () => {
    // If a month only exported repaired DN15 and zero new meters of any size
    const totalRepairedByDN: Record<string, number> = {
      DN15: 590,
      DN25: 0,
      DN32: 0,
      DN40: 0,
      DN50: 0,
    };
    const totalNewByDN: Record<string, number> = {
      DN15: 0,
      DN25: 0,
      DN32: 0,
      DN40: 0,
      DN80: 0,
      DN150: 0,
      DN200: 0,
    };

    const sortDNs = (dns: string[]) => [...dns].sort((a, b) => (DN_ORDER_MAP[a] || 999) - (DN_ORDER_MAP[b] || 999));

    const actRep = Object.keys(totalRepairedByDN).filter(dn => (totalRepairedByDN[dn] || 0) > 0);
    const actNew = Object.keys(totalNewByDN).filter(dn => (totalNewByDN[dn] || 0) > 0);

    const repairedDNs = sortDNs(actRep);
    const newDNs = sortDNs(actNew);

    expect(repairedDNs).toEqual(['DN15']);
    expect(newDNs).toEqual([]); // Zero empty columns!
  });

  it('should generate valid Excel buffer from GET handler with active columns only', async () => {
    const { GET } = await import('../../src/app/api/export-monthly-unit-report/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost:3000/api/export-monthly-unit-report?year=2026&month=9&onlyActive=true&creatorName=%C4%90%E1%BB%93ng%20%C4%90%E1%BB%A9c%20Anh&deptManagerName=Ph%E1%BA%A1m%20Ph%C6%B0%C6%A1ng%20%C4%90%C3%B4ng');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('spreadsheetml');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });
});
