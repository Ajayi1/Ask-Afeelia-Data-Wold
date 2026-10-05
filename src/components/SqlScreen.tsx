import React, { useState } from 'react';
import { Copy, Check, Play, Edit3, Terminal, AlertCircle } from 'lucide-react';
import { DatasetState, SqlQueryItem } from '../types/data';
import { executeSqlQuery } from '../utils/sqlEngine';

interface SqlScreenProps {
  datasetState: DatasetState;
}

export const SqlScreen: React.FC<SqlScreenProps> = ({ datasetState }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedQueries, setEditedQueries] = useState<Record<string, string>>({});
  const [queryResults, setQueryResults] = useState<Record<string, any[]>>({});
  const [queryErrors, setQueryErrors] = useState<Record<string, string | null>>({});

  // Playground state
  const [customSql, setCustomSql] = useState<string>(
    `SELECT * FROM dataset LIMIT 10`
  );
  const [customResult, setCustomResult] = useState<any[] | null>(null);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [customError, setCustomError] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState<number | null>(null);

  // Initialize query results if not yet run
  const queries: SqlQueryItem[] = datasetState.analysis?.queries || [
    {
      id: 'q1',
      title: 'Primary Aggregate Breakdown',
      explanation: 'Calculates group-level volume metrics to reveal concentration and key drivers.',
      sql: `SELECT * FROM dataset LIMIT 10`,
    }
  ];

  // Execute on load if not stored
  React.useEffect(() => {
    queries.forEach(q => {
      if (!queryResults[q.id]) {
        const res = executeSqlQuery(q.sql, datasetState.rows);
        if (res.success) {
          setQueryResults(prev => ({ ...prev, [q.id]: res.data }));
          setQueryErrors(prev => ({ ...prev, [q.id]: null }));
        } else {
          setQueryErrors(prev => ({ ...prev, [q.id]: res.error || 'Failed' }));
        }
      }
    });
  }, [queries, datasetState.rows]);

  const handleCopy = (id: string, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunQuery = (id: string) => {
    const sqlToRun = editedQueries[id] ?? queries.find(q => q.id === id)?.sql ?? '';
    const res = executeSqlQuery(sqlToRun, datasetState.rows);
    if (res.success) {
      setQueryResults(prev => ({ ...prev, [id]: res.data }));
      setQueryErrors(prev => ({ ...prev, [id]: null }));
    } else {
      setQueryErrors(prev => ({ ...prev, [id]: res.error || 'Syntax error' }));
    }
  };

  const handleRunCustomPlayground = () => {
    const res = executeSqlQuery(customSql, datasetState.rows);
    if (res.success) {
      setCustomResult(res.data);
      setCustomColumns(res.columns);
      setCustomError(null);
      setCustomTime(res.executionTimeMs);
    } else {
      setCustomResult(null);
      setCustomColumns([]);
      setCustomError(res.error || 'Execution error');
      setCustomTime(res.executionTimeMs);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#F97316]">
            SQL Engine & Evidence
          </span>
          <h2 className="text-2xl font-bold text-[#111111] mt-0.5">
            Diagnostic SQL Queries
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            Data is loaded into the in-memory SQL table <code className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-orange-600">dataset</code> ({datasetState.rows.length} rows). Edit, copy, or execute queries below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 font-semibold rounded-lg">
            Table: "dataset" ({datasetState.stats.columnsCount} columns)
          </span>
        </div>
      </div>

      {/* Objective Reminder */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
            Objective Addressed
          </span>
          <p className="text-xs font-semibold text-[#111111] mt-0.5">
            {datasetState.objective || 'Identify top drivers of performance'}
          </p>
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {queries.length} queries generated
        </span>
      </div>

      {/* Query Cards */}
      <div className="space-y-6">
        {queries.map((q, idx) => {
          const currentSql = editedQueries[q.id] ?? q.sql;
          const isEditing = editingId === q.id;
          const results = queryResults[q.id] || [];
          const error = queryErrors[q.id];
          const resultCols = results.length > 0 ? Object.keys(results[0]) : [];

          return (
            <div
              key={q.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-[#F97316] font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-[#111111]">{q.title}</h3>
                  </div>
                  <p className="text-xs text-[#6B7280] ml-7">{q.explanation}</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => setEditingId(isEditing ? null : q.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 rounded-lg text-[#111111] hover:bg-gray-50 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                    <span>{isEditing ? 'Done' : 'Edit'}</span>
                  </button>

                  <button
                    onClick={() => handleCopy(q.id, currentSql)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 rounded-lg text-[#111111] hover:bg-gray-50 cursor-pointer"
                  >
                    {copiedId === q.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleRunQuery(q.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Run</span>
                  </button>
                </div>
              </div>

              {/* SQL Code Block or Textarea */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                {isEditing ? (
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-gray-600 uppercase">
                      Edit SQL (table name: dataset):
                    </label>
                    <textarea
                      value={currentSql}
                      onChange={e =>
                        setEditedQueries(prev => ({ ...prev, [q.id]: e.target.value }))
                      }
                      rows={4}
                      className="w-full font-mono text-xs p-3 bg-white border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500"
                    />
                  </div>
                ) : (
                  <pre className="font-mono text-xs text-[#111111] whitespace-pre-wrap overflow-x-auto bg-white p-3 rounded-lg border border-gray-200">
                    <code>{currentSql}</code>
                  </pre>
                )}

                {error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Result Table */}
              <div className="p-4">
                <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
                  <span className="font-medium text-[#111111]">Query Results</span>
                  <span>{results.length} rows returned</span>
                </div>

                {results.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-100 rounded-lg max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                        <tr>
                          {resultCols.map(col => (
                            <th
                              key={col}
                              className="px-3 py-2 font-semibold text-[#111111] uppercase tracking-wider text-[10px] whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {results.slice(0, 15).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-orange-50/20">
                            {resultCols.map(col => (
                              <td
                                key={col}
                                className="px-3 py-1.5 text-[#111111] font-mono text-[11px] whitespace-nowrap"
                              >
                                {row[col] !== null && row[col] !== undefined
                                  ? typeof row[col] === 'number'
                                    ? Number.isInteger(row[col])
                                      ? row[col].toLocaleString()
                                      : row[col].toFixed(2)
                                    : String(row[col])
                                  : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-[#6B7280]">
                    {error ? 'Execution failed. Review SQL above.' : 'No rows returned.'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ad-hoc Custom SQL Playground */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#F97316]" />
            <h3 className="text-sm font-bold text-[#111111]">Interactive SQL Playground</h3>
          </div>
          <span className="text-xs text-[#6B7280]">Target: table "dataset"</span>
        </div>

        <textarea
          value={customSql}
          onChange={e => setCustomSql(e.target.value)}
          rows={3}
          placeholder="SELECT category, SUM(revenue) FROM dataset GROUP BY category"
          className="w-full font-mono text-xs p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#6B7280]">
            Supports ANSI SQL: GROUP BY, ORDER BY, Aggregates, CASE, HAVING, LIMIT
          </span>
          <button
            onClick={handleRunCustomPlayground}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Execute SQL</span>
          </button>
        </div>

        {customError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{customError}</span>
          </div>
        )}

        {customResult && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
              <span className="font-semibold text-[#111111]">Playground Output</span>
              <span>
                {customResult.length} rows ({customTime}ms)
              </span>
            </div>

            {customResult.length > 0 ? (
              <div className="overflow-x-auto border border-gray-100 rounded-lg max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                    <tr>
                      {customColumns.map(col => (
                        <th key={col} className="px-3 py-2 font-semibold text-[#111111] text-[10px] whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customResult.slice(0, 20).map((row, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/20">
                        {customColumns.map(col => (
                          <td key={col} className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-2">Query executed successfully with 0 rows returned.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
