import { supabase } from '@/integrations/supabase/client';

/**
 * Full read-only backup of all application data the admin can read via RLS.
 *
 * This NEVER writes anything — it only SELECTs every row from each table and
 * bundles them into a single JSON file the browser downloads. It is safe to run
 * any number of times and does not touch the live site or database.
 *
 * Not included: auth.users password hashes (Supabase never exposes them).
 * Student emails live in `profiles`, so accounts can be recreated if needed.
 */

const BACKUP_TABLES = [
  'profiles',
  'user_roles',
  'courses',
  'lessons',
  'lesson_videos',
  'course_access',
  'lesson_progress',
  'invite_codes',
  'site_settings',
] as const;

export interface BackupResult {
  fileName: string;
  counts: Record<string, number>;
}

async function fetchAll(table: string): Promise<unknown[]> {
  const rows: unknown[] = [];
  const pageSize = 1000;
  let from = 0;
  // Paginate so large tables (e.g. lesson_progress) are fully captured.
  for (;;) {
    const { data, error } = await supabase
      .from(table as never)
      .select('*')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data as unknown[]) || [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

export async function exportBackup(): Promise<BackupResult> {
  const tables: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  for (const table of BACKUP_TABLES) {
    const rows = await fetchAll(table);
    tables[table] = rows;
    counts[table] = rows.length;
  }

  const stamp = new Date().toISOString();
  const payload = {
    meta: {
      app: 'trade-like-tyo',
      kind: 'full-data-backup',
      exported_at: stamp,
      note: 'Passwords are not included (Supabase never exposes them). Emails are in profiles.',
    },
    counts,
    tables,
  };

  const datePart = stamp.slice(0, 19).replace(/[:T]/g, '-');
  const fileName = `tlt-backup-${datePart}.json`;

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { fileName, counts };
}
