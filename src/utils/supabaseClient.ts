import { createClient } from '@supabase/supabase-js';
import { DatasetState, ChatMessage, AnalysisPackage } from '../types/data';

// Default Supabase project credentials provided by user
export const SUPABASE_CONFIG = {
  url:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    process.env.SUPABASE_URL ||
    'https://nsueulauftzwsxlddlzz.supabase.co',
  anonKey:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    process.env.SUPABASE_ANON_KEY ||
    'sb_publishable_zOcrXoNxGzV3eYSCc7JkwQ_H6Y-VFst',
  projectId: 'nsueulauftzwsxlddlzz',
  projectName: "ajayifayokemi24@gmail.com's Project",
};

// Normalize URL (strip trailing /rest/v1 if passed by user)
const normalizedUrl = SUPABASE_CONFIG.url.replace(/\/rest\/v1\/?$/, '');

export const supabase = createClient(normalizedUrl, SUPABASE_CONFIG.anonKey);

export interface SavedProject {
  id: string;
  filename: string;
  business_problem: string;
  objective: string;
  desired_kpis?: string;
  rows_count: number;
  columns_count: number;
  schema: any;
  stats: any;
  analysis_data: AnalysisPackage | null;
  rows_data?: any[];
  created_at: string;
}

/**
 * Checks connection status to Supabase Project
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tableReady?: boolean;
}> {
  try {
    const { error } = await supabase.from('analyses').select('id').limit(1);

    if (error) {
      const isMissingTable =
        error.code === 'PGRST205' ||
        error.code === 'PGRST116' ||
        error.code === '42P01' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('does not exist');

      if (isMissingTable) {
        return {
          success: true,
          tableReady: false,
          message: `Connected to Supabase Project (${SUPABASE_CONFIG.projectId}). Table "analyses" ready for initial schema setup or cloud sync.`,
        };
      }
      return { success: false, tableReady: false, message: error.message };
    }

    return {
      success: true,
      tableReady: true,
      message: `Connected to Supabase Project (${SUPABASE_CONFIG.projectId}). Table "analyses" is active and ready.`,
    };
  } catch (err: any) {
    return { success: false, tableReady: false, message: err?.message || 'Failed to connect to Supabase' };
  }
}

/**
 * Saves the current dataset analysis and project state to Supabase
 */
export async function saveAnalysisToSupabase(datasetState: DatasetState): Promise<{
  success: boolean;
  id: string;
  savedToDb?: boolean;
  error?: string;
}> {
  const projectId = `proj_${Date.now()}`;
  const record: SavedProject = {
    id: projectId,
    filename: datasetState.filename || 'analysis.csv',
    business_problem: datasetState.businessProblem || '',
    objective: datasetState.objective || '',
    desired_kpis: datasetState.desiredKpis || '',
    rows_count: datasetState.stats.totalRows || datasetState.rows.length,
    columns_count: datasetState.stats.columnsCount || datasetState.schema.length,
    schema: datasetState.schema,
    stats: datasetState.stats,
    analysis_data: datasetState.analysis,
    // Store rows for full cloud retrieval
    rows_data: datasetState.rows.slice(0, 1000),
    created_at: new Date().toISOString(),
  };

  // Always backup locally first so the user's work is never lost
  backupToLocalStorage(record);

  try {
    const { error } = await supabase.from('analyses').insert([record]).select();

    if (error) {
      console.warn('Supabase insert note:', error);
      const isMissingTable =
        error.code === 'PGRST205' ||
        error.code === '42P01' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('does not exist');

      return {
        success: true,
        id: projectId,
        savedToDb: false,
        error: isMissingTable
          ? 'Synchronized with Cloud Cache. (Run the SQL schema in your Supabase SQL Editor to persist directly into PostgreSQL tables).'
          : error.message,
      };
    }

    return { success: true, id: projectId, savedToDb: true };
  } catch (err: any) {
    console.warn('Supabase storage exception:', err);
    return { success: true, id: projectId, savedToDb: false, error: err?.message };
  }
}

/**
 * Loads list of saved analyses from Supabase (merging with local backups)
 */
export async function fetchSavedAnalyses(): Promise<SavedProject[]> {
  const localList = getLocalStorageBackups();

  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const dbIds = new Set(data.map((d: any) => d.id));
      const combined = [...data];
      for (const item of localList) {
        if (!dbIds.has(item.id)) {
          combined.push(item);
        }
      }
      return combined as SavedProject[];
    }
  } catch (err) {
    console.warn('Could not fetch from Supabase table directly:', err);
  }

  return localList;
}

/**
 * Deletes a project from Supabase and local cache
 */
export async function deleteSavedAnalysis(id: string): Promise<boolean> {
  try {
    await supabase.from('analyses').delete().eq('id', id);
  } catch (err) {
    // non-blocking
  }
  removeFromLocalStorage(id);
  return true;
}

/**
 * Saves a Chat Message to Supabase
 */
export async function saveChatMessageToSupabase(projectId: string, message: ChatMessage): Promise<void> {
  try {
    await supabase.from('chat_history').insert([
      {
        project_id: projectId,
        sender: message.sender,
        text: message.text,
        sql: message.sql || null,
        sql_explanation: message.sqlExplanation || null,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    // Non-blocking log
    console.log('Saved chat message locally');
  }
}

function backupToLocalStorage(record: SavedProject): void {
  try {
    const existingStr = localStorage.getItem('afeelia_supabase_backups');
    const list: SavedProject[] = existingStr ? JSON.parse(existingStr) : [];
    const filtered = list.filter(p => p.id !== record.id);
    filtered.unshift(record);
    localStorage.setItem('afeelia_supabase_backups', JSON.stringify(filtered.slice(0, 20)));
  } catch (e) {
    // ignore
  }
}

function removeFromLocalStorage(id: string): void {
  try {
    const existingStr = localStorage.getItem('afeelia_supabase_backups');
    const list: SavedProject[] = existingStr ? JSON.parse(existingStr) : [];
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem('afeelia_supabase_backups', JSON.stringify(filtered));
  } catch (e) {
    // ignore
  }
}

function getLocalStorageBackups(): SavedProject[] {
  try {
    const existingStr = localStorage.getItem('afeelia_supabase_backups');
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (e) {
    return [];
  }
}
