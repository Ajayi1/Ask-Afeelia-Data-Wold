import alasql from 'alasql';

// Register essential functions in AlaSQL
try {
  // @ts-ignore
  if (!alasql.fn) alasql.fn = {};

  // @ts-ignore
  alasql.fn.ROUND = function (val: any, dec: any = 0) {
    if (val === null || val === undefined || isNaN(Number(val))) return 0;
    const factor = Math.pow(10, Number(dec) || 0);
    return Math.round(Number(val) * factor) / factor;
  };
  // @ts-ignore
  alasql.fn.round = alasql.fn.ROUND;

  // @ts-ignore
  alasql.fn.NULLIF = function (a: any, b: any) {
    return a === b ? null : a;
  };
  // @ts-ignore
  alasql.fn.nullif = alasql.fn.NULLIF;

  // @ts-ignore
  alasql.fn.COALESCE = function (...args: any[]) {
    return args.find(a => a !== null && a !== undefined && a !== '') ?? null;
  };
  // @ts-ignore
  alasql.fn.coalesce = alasql.fn.COALESCE;

  // @ts-ignore
  alasql.fn.IFNULL = function (a: any, b: any) {
    return a !== null && a !== undefined && a !== '' ? a : b;
  };
  // @ts-ignore
  alasql.fn.ifnull = alasql.fn.IFNULL;
} catch (e) {
  console.warn('Could not register custom functions on AlaSQL:', e);
}

export interface SqlExecutionResult {
  success: boolean;
  data: any[];
  columns: string[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

/**
 * Initializes and syncs the dataset in AlaSQL in-memory engine
 */
export function loadTableIntoSql(rows: Record<string, any>[]): void {
  try {
    try {
      alasql('DROP TABLE IF EXISTS dataset');
    } catch {
      // ignore
    }
    alasql('CREATE TABLE dataset');
    if (alasql.tables && alasql.tables.dataset) {
      alasql.tables.dataset.data = [...rows];
    }
  } catch (err) {
    console.error('Failed to load table into SQL engine:', err);
  }
}

/**
 * Clean & normalize SQL string for safe execution
 */
function normalizeQuery(sql: string): string {
  let cleaned = sql.trim();
  // Strip trailing semicolon
  if (cleaned.endsWith(';')) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

/**
 * Run a SQL query against the in-memory dataset table
 */
export function executeSqlQuery(sql: string, rows?: Record<string, any>[]): SqlExecutionResult {
  const startTime = performance.now();

  if (rows && rows.length > 0) {
    loadTableIntoSql(rows);
  }

  const query = normalizeQuery(sql);

  try {
    const rawResult = alasql(query);
    const executionTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

    let data: any[] = [];
    if (Array.isArray(rawResult)) {
      data = rawResult;
    } else if (rawResult !== null && rawResult !== undefined) {
      data = [{ result: rawResult }];
    }

    const columns: string[] = data.length > 0 && typeof data[0] === 'object' && data[0] !== null
      ? Object.keys(data[0])
      : [];

    return {
      success: true,
      data,
      columns,
      rowCount: data.length,
      executionTimeMs,
    };
  } catch (err: any) {
    const executionTimeMs = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      success: false,
      data: [],
      columns: [],
      rowCount: 0,
      executionTimeMs,
      error: err?.message || 'SQL execution failed. Please verify syntax and column names.',
    };
  }
}

/**
 * Bulletproof fallback metric calculator when a SQL KPI query fails or returns null.
 * Inspects SQL or Title to calculate aggregate directly on rows.
 */
export function calculateFallbackKpi(
  sql: string,
  title: string,
  rows: Record<string, any>[],
  primaryNumCol?: string,
  secondaryNumCol?: string
): number {
  if (!rows || rows.length === 0) return 0;

  const combined = (sql + ' ' + title).toLowerCase();
  const sampleRow = rows[0] || {};
  const allCols = Object.keys(sampleRow);
  const numCols = allCols.filter(c => typeof sampleRow[c] === 'number');

  // Try to find the target column mentioned in SQL or title
  let targetCol = numCols.find(c => combined.includes(c.toLowerCase()));
  if (!targetCol) {
    targetCol = primaryNumCol || numCols[0];
  }

  if (combined.includes('count') && !combined.includes('sum')) {
    if (combined.includes('distinct')) {
      const distinctCol = allCols.find(c => combined.includes(c.toLowerCase())) || allCols[0];
      return new Set(rows.map(r => r[distinctCol])).size;
    }
    return rows.length;
  }

  if (!targetCol) return rows.length;

  const values = rows.map(r => Number(r[targetCol!]) || 0);

  if (combined.includes('avg') || combined.includes('average') || combined.includes('rate') || combined.includes('pct') || combined.includes('percent')) {
    const sum = values.reduce((a, b) => a + b, 0);
    return values.length > 0 ? sum / values.length : 0;
  }

  if (combined.includes('max')) {
    return Math.max(...values, 0);
  }

  if (combined.includes('min')) {
    return Math.min(...values, 0);
  }

  // Default to SUM
  return values.reduce((a, b) => a + b, 0);
}
