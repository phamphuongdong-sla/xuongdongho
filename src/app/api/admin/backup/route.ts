import { exportSystemBackup } from '@/actions/backup';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth(['admin']);
    const backup = await exportSystemBackup();
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `sowasuco_backup_${dateStr}.json`;

    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unauthorized' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
