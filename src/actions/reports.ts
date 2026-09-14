'use server';

import fs from 'node:fs';
import path from 'node:path';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

const BALANCES_FILE = path.join(process.cwd(), 'data', 'opening-balances.json');

export interface OpeningBalancesData {
  meters?: Record<string, Record<string, number>>; // year -> meterCode -> opening
  parts?: Record<string, Record<string, number>>;  // year -> partName -> opening
}

export async function getOpeningStockOverrides(): Promise<OpeningBalancesData> {
  try {
    if (fs.existsSync(BALANCES_FILE)) {
      const content = fs.readFileSync(BALANCES_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading opening balances:', err);
  }
  return { meters: {}, parts: {} };
}

export async function updateOpeningStock(data: {
  year: number;
  type: 'meter' | 'part';
  identifier: string; // meter code or part name
  opening: number;
}) {
  await requireAuth(['admin']);
  const { year, type, identifier, opening } = data;
  const current = await getOpeningStockOverrides();

  const yrStr = String(year);
  if (type === 'meter') {
    if (!current.meters) current.meters = {};
    if (!current.meters[yrStr]) current.meters[yrStr] = {};
    current.meters[yrStr][identifier] = Math.max(0, opening);
  } else {
    if (!current.parts) current.parts = {};
    if (!current.parts[yrStr]) current.parts[yrStr] = {};
    current.parts[yrStr][identifier] = Math.max(0, opening);
  }

  const dir = path.dirname(BALANCES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(BALANCES_FILE, JSON.stringify(current, null, 2), 'utf8');

  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  return { success: true, year, type, identifier, opening };
}

const UNIT_PLANS_FILE = path.join(process.cwd(), 'data', 'unit-yearly-plans.json');

export async function getUnitYearlyPlans(): Promise<Record<string, number>> {
  try {
    if (fs.existsSync(UNIT_PLANS_FILE)) {
      const content = fs.readFileSync(UNIT_PLANS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading unit yearly plans:', err);
  }
  return {};
}

export async function saveUnitYearlyPlans(plans: Record<string, number>) {
  try {
    const dir = path.dirname(UNIT_PLANS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(UNIT_PLANS_FILE, JSON.stringify(plans, null, 2), 'utf8');
    revalidatePath('/unit-reports');
    return { success: true };
  } catch (err: any) {
    console.error('Error saving unit yearly plans:', err);
    return { success: false, error: err.message };
  }
}

const UNIT_USED_PLANS_FILE = path.join(process.cwd(), 'data', 'unit-used-yearly-plans.json');

export async function getUnitUsedYearlyPlans(): Promise<Record<string, number>> {
  try {
    if (fs.existsSync(UNIT_USED_PLANS_FILE)) {
      const content = fs.readFileSync(UNIT_USED_PLANS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading unit used yearly plans:', err);
  }
  return {};
}

export async function saveUnitUsedYearlyPlans(plans: Record<string, number>) {
  try {
    const dir = path.dirname(UNIT_USED_PLANS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(UNIT_USED_PLANS_FILE, JSON.stringify(plans, null, 2), 'utf8');
    revalidatePath('/unit-reports');
    return { success: true };
  } catch (err: any) {
    console.error('Error saving unit used yearly plans:', err);
    return { success: false, error: err.message };
  }
}
