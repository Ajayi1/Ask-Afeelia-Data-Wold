import * as XLSX from 'xlsx';
import { ColumnSchema, ColumnType, CleaningStats } from '../types/data';

/**
 * Normalizes string keys into clean SQL-friendly column names
 */
export function sanitizeColumnName(rawName: string, index: number): string {
  if (!rawName || typeof rawName !== 'string') {
    return `col_${index + 1}`;
  }
  let clean = rawName
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_');

  if (!clean || /^\d/.test(clean)) {
    clean = `col_${clean || index + 1}`;
  }
  return clean;
}

/**
 * Infer data type for a column given sample values
 */
export function inferColumnType(values: any[]): ColumnType {
  const nonNulls = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNulls.length === 0) return 'string';

  let numCount = 0;
  let dateCount = 0;
  let boolCount = 0;

  for (const val of nonNulls) {
    if (typeof val === 'boolean') {
      boolCount++;
      continue;
    }
    if (typeof val === 'number' && !isNaN(val)) {
      numCount++;
      continue;
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false') {
        boolCount++;
        continue;
      }
      // Check if pure numeric string
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        numCount++;
        continue;
      }
      // Check date
      const d = Date.parse(trimmed);
      if (!isNaN(d) && (trimmed.includes('-') || trimmed.includes('/')) && trimmed.length >= 8) {
        dateCount++;
        continue;
      }
    }
  }

  const ratio = 0.75;
  if (numCount / nonNulls.length >= ratio) return 'number';
  if (dateCount / nonNulls.length >= ratio) return 'date';
  if (boolCount / nonNulls.length >= ratio) return 'boolean';
  return 'string';
}

export interface ParseResult {
  filename: string;
  sheets: string[];
  activeSheet: string;
  workbook: XLSX.WorkBook;
  rows: Record<string, any>[];
  schema: ColumnSchema[];
  stats: CleaningStats;
}

/**
 * Read and clean raw file buffer or ArrayBuffer
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('The uploaded file does not contain any sheets or data.');
  }

  const activeSheet = sheetNames[0];
  const { rows, schema, stats } = extractAndCleanSheet(workbook, activeSheet, sheetNames);

  return {
    filename: file.name,
    sheets: sheetNames,
    activeSheet,
    workbook,
    rows,
    schema,
    stats,
  };
}

/**
 * Extract and clean data from a specific sheet in an existing workbook
 */
export function extractAndCleanSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  allSheets: string[]
): { rows: Record<string, any>[]; schema: ColumnSchema[]; stats: CleaningStats } {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" was not found.`);
  }

  // Parse raw JSON rows with raw values
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: false,
  });

  if (rawRows.length === 0) {
    throw new Error(`Sheet "${sheetName}" is empty. Please upload a dataset with headers and data rows.`);
  }

  return cleanRawRows(rawRows, allSheets, sheetName);
}

/**
 * Deep data cleaning pipeline:
 * 1. Normalizes column names
 * 2. Informs & casts column types
 * 3. Handles blanks and nulls
 * 4. Deduplicates records
 */
export function cleanRawRows(
  rawRows: Record<string, any>[],
  allSheets: string[] = ['Sheet1'],
  activeSheet: string = 'Sheet1'
): { rows: Record<string, any>[]; schema: ColumnSchema[]; stats: CleaningStats } {
  const rawHeaders = Object.keys(rawRows[0] || {});
  const sanitizedColsMap = new Map<string, string>();
  const seenColNames = new Set<string>();

  rawHeaders.forEach((rawCol, idx) => {
    let cleanName = sanitizeColumnName(rawCol, idx);
    let counter = 1;
    while (seenColNames.has(cleanName)) {
      cleanName = `${sanitizeColumnName(rawCol, idx)}_${counter++}`;
    }
    seenColNames.add(cleanName);
    sanitizedColsMap.set(rawCol, cleanName);
  });

  // Determine column types based on first 100 rows
  const sampleForTypes = rawRows.slice(0, 100);
  const columnTypes = new Map<string, ColumnType>();

  rawHeaders.forEach(rawCol => {
    const vals = sampleForTypes.map(r => r[rawCol]);
    const inferred = inferColumnType(vals);
    const cleanCol = sanitizedColsMap.get(rawCol)!;
    columnTypes.set(cleanCol, inferred);
  });

  let blanksCleaned = 0;
  const cleanedRows: Record<string, any>[] = [];
  const rowSignatures = new Set<string>();
  let duplicatesRemoved = 0;

  for (const row of rawRows) {
    const cleanedRow: Record<string, any> = {};

    for (const rawCol of rawHeaders) {
      const cleanCol = sanitizedColsMap.get(rawCol)!;
      const targetType = columnTypes.get(cleanCol)!;
      let val = row[rawCol];

      if (val === null || val === undefined || val === '' || val === 'N/A' || val === 'NaN' || val === 'null') {
        blanksCleaned++;
        if (targetType === 'number') {
          val = 0;
        } else if (targetType === 'boolean') {
          val = false;
        } else {
          val = 'Unknown';
        }
      } else if (targetType === 'number') {
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[$,]/g, '').trim());
        val = isNaN(num) ? 0 : num;
      } else if (targetType === 'boolean') {
        val = String(val).toLowerCase() === 'true' || val === 1 || val === '1';
      } else if (targetType === 'date') {
        val = String(val).trim();
      } else {
        val = String(val).trim();
      }

      cleanedRow[cleanCol] = val;
    }

    // Deduplication check
    const sig = JSON.stringify(cleanedRow);
    if (rowSignatures.has(sig)) {
      duplicatesRemoved++;
    } else {
      rowSignatures.add(sig);
      cleanedRows.push(cleanedRow);
    }
  }

  // Build schema
  const schema: ColumnSchema[] = Array.from(sanitizedColsMap.entries()).map(([rawCol, cleanCol]) => {
    const type = columnTypes.get(cleanCol) || 'string';
    const sampleVals = cleanedRows.slice(0, 5).map(r => r[cleanCol]);
    const distinctSet = new Set(cleanedRows.map(r => r[cleanCol]));

    return {
      name: cleanCol,
      originalName: rawCol,
      type,
      sampleValues: sampleVals,
      distinctCount: distinctSet.size,
    };
  });

  const stats: CleaningStats = {
    totalRows: cleanedRows.length,
    columnsCount: schema.length,
    blanksCleaned,
    duplicatesRemoved,
    sheetsFound: allSheets,
    activeSheet,
  };

  return { rows: cleanedRows, schema, stats };
}
