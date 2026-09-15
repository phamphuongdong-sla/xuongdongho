'use server';

import fs from 'node:fs';
import path from 'node:path';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

import { prisma } from '@/lib/prisma';
import openingBalancesJson from '@/data/opening-balances.json';

const BALANCES_FILE = path.join(process.cwd(), 'data', 'opening-balances.json');

export interface OpeningBalancesData {
  meters?: Record<string, Record<string, number>>; // year -> meterCode -> opening
  parts?: Record<string, Record<string, number>>;  // year -> partName -> opening
}

export async function getOpeningStockOverrides(): Promise<OpeningBalancesData> {
  // 1. Try reading from AppSetting table (supported on both SQLite & Cloudflare D1)
  try {
    const setting = await (prisma as any).$queryRawUnsafe(
      `SELECT value FROM AppSetting WHERE key = 'opening_balances' LIMIT 1;`
    );
    if (setting && Array.isArray(setting) && setting.length > 0 && setting[0].value) {
      return JSON.parse(setting[0].value);
    }
  } catch (err) {
    // AppSetting query error fallback
  }

  // 2. Try reading from filesystem if exists (Node.js runtime)
  try {
    if (fs.existsSync(BALANCES_FILE)) {
      const content = fs.readFileSync(BALANCES_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    // Ignore fs error on edge/worker
  }

  // 3. Fallback to bundled JSON
  return (openingBalancesJson || { meters: {}, parts: {} }) as OpeningBalancesData;
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

  const jsonStr = JSON.stringify(current, null, 2);

  // 1. Persist to AppSetting in database (D1 & SQLite)
  try {
    await (prisma as any).$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS AppSetting (key TEXT PRIMARY KEY, value TEXT NOT NULL, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);`
    );
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO AppSetting (key, value, updatedAt) VALUES ('opening_balances', ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = CURRENT_TIMESTAMP;`,
      jsonStr
    );
  } catch (dbErr) {
    console.error('Error persisting opening balances to AppSetting table:', dbErr);
  }

  // 2. Persist to local filesystem if writable
  try {
    const dir = path.dirname(BALANCES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BALANCES_FILE, jsonStr, 'utf8');
  } catch (e) {
    // Edge / worker runtime does not have writable filesystem
  }

  try {
    revalidatePath('/reports');
    revalidatePath('/unit-reports');
  } catch (e) {
    // Ignore revalidate error
  }
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
