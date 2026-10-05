import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface DataTableChartProps {
  title: string;
  subtitle?: string;
  rows: Record<string, any>[];
  maxRows?: number;
}

export const DataTableChartComponent: React.FC<DataTableChartProps> = ({
  title,
  subtitle,
  rows,
  maxRows = 8,
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  if (!rows || rows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-gray-500 min-h-[220px]">
        <p className="text-sm">No tabular records available</p>
      </div>
    );
  }

  const columns = Object.keys(rows[0] || {});

  const filteredRows = rows.filter(r => {
    if (!search) return true;
    return columns.some(col => String(r[col] ?? '').toLowerCase().includes(search.toLowerCase()));
  });

  const totalPages = Math.ceil(filteredRows.length / maxRows) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * maxRows, currentPage * maxRows);

  const formatCellValue = (val: any) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'number') {
      return Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2);
    }
    return String(val);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-[#111111]">{title}</h4>
          {subtitle && <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search records..."
            className="pl-8 pr-3 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 w-44"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 text-[#111111] border-b border-gray-200">
              {columns.map(col => (
                <th key={col} className="px-3 py-2 font-semibold uppercase tracking-wider text-[10px] text-gray-700 whitespace-nowrap">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-orange-50/40 transition-colors">
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 text-[#111111] whitespace-nowrap">
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-[#6B7280] mt-3 pt-2 border-t border-gray-100">
        <span>Showing {Math.min(filteredRows.length, (currentPage - 1) * maxRows + 1)} - {Math.min(filteredRows.length, currentPage * maxRows)} of {filteredRows.length}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-0.5 border border-gray-200 rounded text-xs disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
          >
            Prev
          </button>
          <span className="px-1 text-[11px]">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-2 py-0.5 border border-gray-200 rounded text-xs disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
