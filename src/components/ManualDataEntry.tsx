import React, { useState } from 'react';
import { Plus, Trash2, ClipboardPaste, Check, Sparkles, AlertCircle } from 'lucide-react';
import { ColumnType, ColumnSchema } from '../types/data';
import { cleanRawRows } from '../utils/dataProcessor';

interface ColumnDef {
  id: string;
  name: string;
  type: ColumnType;
}

interface ManualDataEntryProps {
  onCommitData: (rows: Record<string, any>[], schema: ColumnSchema[], stats: any) => void;
}

export const ManualDataEntry: React.FC<ManualDataEntryProps> = ({ onCommitData }) => {
  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: 'c1', name: 'region', type: 'string' },
    { id: 'c2', name: 'period', type: 'string' },
    { id: 'c3', name: 'revenue', type: 'number' },
    { id: 'c4', name: 'target', type: 'number' },
    { id: 'c5', name: 'units_sold', type: 'number' },
  ]);

  const [rows, setRows] = useState<Record<string, string>[]>([
    { c1: 'North', c2: 'Q1', c3: '420000', c4: '400000', c5: '2100' },
    { c1: 'North', c2: 'Q2', c3: '380000', c4: '410000', c5: '1900' },
    { c1: 'North', c2: 'Q3', c3: '310000', c4: '420000', c5: '1550' },
    { c1: 'North', c2: 'Q4', c3: '240000', c4: '430000', c5: '1200' },
    { c1: 'South', c2: 'Q1', c3: '390000', c4: '380000', c5: '1950' },
    { c1: 'South', c2: 'Q2', c3: '410000', c4: '390000', c5: '2050' },
  ]);

  const [pasteText, setPasteText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add column
  const handleAddColumn = () => {
    const colId = `c${Date.now()}`;
    const colName = `column_${columns.length + 1}`;
    setColumns(prev => [...prev, { id: colId, name: colName, type: 'string' }]);
    setRows(prev => prev.map(r => ({ ...r, [colId]: '' })));
  };

  // Remove column
  const handleRemoveColumn = (colId: string) => {
    if (columns.length <= 1) {
      setError('You must have at least one column.');
      return;
    }
    setColumns(prev => prev.filter(c => c.id !== colId));
    setRows(prev =>
      prev.map(r => {
        const copy = { ...r };
        delete copy[colId];
        return copy;
      })
    );
  };

  // Update column definition
  const handleUpdateColumn = (colId: string, name: string, type: ColumnType) => {
    setColumns(prev => prev.map(c => (c.id === colId ? { ...c, name, type } : c)));
  };

  // Add row
  const handleAddRow = () => {
    const newRow: Record<string, string> = {};
    columns.forEach(c => {
      newRow[c.id] = '';
    });
    setRows(prev => [...prev, newRow]);
  };

  // Update cell
  const handleCellChange = (rowIndex: number, colId: string, value: string) => {
    setRows(prev => {
      const copy = [...prev];
      copy[rowIndex] = { ...copy[rowIndex], [colId]: value };
      return copy;
    });
  };

  // Remove row
  const handleRemoveRow = (rowIndex: number) => {
    if (rows.length <= 1) {
      setError('You must have at least one row.');
      return;
    }
    setRows(prev => prev.filter((_, idx) => idx !== rowIndex));
  };

  // Parse pasted CSV/TSV data
  const handleImportPastedData = () => {
    if (!pasteText.trim()) {
      setError('Please paste tabular text (from Excel, Google Sheets, or CSV).');
      return;
    }

    try {
      const lines = pasteText.trim().split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        setError('Pasted text must contain at least a header row and one data row.');
        return;
      }

      // Check delimiter (tab or comma)
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : ',';

      const rawHeaders = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const newCols: ColumnDef[] = rawHeaders.map((header, idx) => ({
        id: `c${idx + 1}`,
        name: header || `column_${idx + 1}`,
        type: 'string', // will auto-detect next
      }));

      const parsedRows: Record<string, string>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const tokens = lines[i].split(delimiter).map(t => t.trim().replace(/^["']|["']$/g, ''));
        const rowObj: Record<string, string> = {};
        newCols.forEach((col, cIdx) => {
          rowObj[col.id] = tokens[cIdx] ?? '';
        });
        parsedRows.push(rowObj);
      }

      // Infer column types
      newCols.forEach(col => {
        const sampleVals = parsedRows.slice(0, 20).map(r => r[col.id]);
        const numCount = sampleVals.filter(v => v !== '' && !isNaN(Number(v))).length;
        if (numCount / (sampleVals.length || 1) >= 0.7) {
          col.type = 'number';
        }
      });

      setColumns(newCols);
      setRows(parsedRows);
      setShowPasteBox(false);
      setPasteText('');
      setError(null);
      setSuccessMsg(`Successfully imported ${parsedRows.length} rows and ${newCols.length} columns!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError('Failed to parse pasted data: ' + err.message);
    }
  };

  // Final commit to application
  const handleCommit = () => {
    if (rows.length === 0) {
      setError('Please enter at least one row of data.');
      return;
    }

    // Convert internal row keys { c1, c2 } to column names { region, revenue }
    const rawDataObjects: Record<string, any>[] = rows.map(r => {
      const obj: Record<string, any> = {};
      columns.forEach(c => {
        const val = r[c.id];
        if (c.type === 'number') {
          obj[c.name] = val !== '' && !isNaN(Number(val)) ? Number(val) : 0;
        } else {
          obj[c.name] = val || '';
        }
      });
      return obj;
    });

    const { rows: cleanedRows, schema, stats } = cleanRawRows(rawDataObjects, ['ManualEntry'], 'ManualEntry');
    onCommitData(cleanedRows, schema, stats);
    setSuccessMsg('Dataset loaded successfully for analysis!');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-[#111111]">
            Manual Data Editor & Grid
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Define columns, type records, or paste directly from Excel or Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPasteBox(!showPasteBox)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors cursor-pointer"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>{showPasteBox ? 'Hide Paste Box' : 'Quick Paste from Excel'}</span>
          </button>

          <button
            onClick={handleAddColumn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-[#111111] hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Column</span>
          </button>
        </div>
      </div>

      {/* Quick Paste Area */}
      {showPasteBox && (
        <div className="p-4 bg-orange-50/50 border border-orange-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
              <ClipboardPaste className="w-4 h-4 text-orange-600" />
              Paste Raw Spreadsheet or CSV Text:
            </span>
            <span className="text-[11px] text-[#6B7280]">
              First row is treated as column headers
            </span>
          </div>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            rows={4}
            placeholder={"region\tquarter\trevenue\ttarget\nNorth\tQ1\t420000\t400000\nNorth\tQ2\t380000\t410000"}
            className="w-full text-xs font-mono p-3 bg-white border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowPasteBox(false)}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleImportPastedData}
              className="px-4 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Import Pasted Data
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Column Type & Name Header Row */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl max-h-[360px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <tr>
              <th className="w-10 px-2 py-2 text-center text-[10px] text-gray-500">#</th>
              {columns.map(col => (
                <th key={col.id} className="px-2 py-2 min-w-[150px]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        value={col.name}
                        onChange={e => handleUpdateColumn(col.id, e.target.value, col.type)}
                        className="font-bold text-[#111111] bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none focus:border-orange-500"
                      />
                      <button
                        onClick={() => handleRemoveColumn(col.id)}
                        className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer"
                        title="Remove column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <select
                      value={col.type}
                      onChange={e =>
                        handleUpdateColumn(col.id, col.name, e.target.value as ColumnType)
                      }
                      className="text-[10px] bg-gray-100 border border-gray-200 rounded px-1 py-0.5 text-gray-700 focus:outline-none"
                    >
                      <option value="string">Text (string)</option>
                      <option value="number">Number (numeric)</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                </th>
              ))}
              <th className="w-10 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-orange-50/20">
                <td className="px-2 py-1.5 text-center text-[10px] font-mono text-gray-400">
                  {rIdx + 1}
                </td>
                {columns.map(col => (
                  <td key={col.id} className="p-1">
                    <input
                      type={col.type === 'number' ? 'number' : 'text'}
                      value={row[col.id] ?? ''}
                      onChange={e => handleCellChange(rIdx, col.id, e.target.value)}
                      placeholder={col.type === 'number' ? '0' : 'text'}
                      className="w-full px-2 py-1 text-xs border border-transparent hover:border-gray-200 focus:border-orange-500 rounded focus:outline-none"
                    />
                  </td>
                ))}
                <td className="px-2 py-1 text-center">
                  <button
                    onClick={() => handleRemoveRow(rIdx)}
                    className="text-gray-300 hover:text-red-500 p-1 cursor-pointer"
                    title="Delete row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          onClick={handleAddRow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-[#111111] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Row</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6B7280]">
            {rows.length} rows, {columns.length} columns configured
          </span>
          <button
            onClick={handleCommit}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-none"
          >
            <Check className="w-4 h-4" />
            <span>Load Data for Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
};
