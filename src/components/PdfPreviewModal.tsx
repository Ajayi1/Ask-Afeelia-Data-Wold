import React, { useState } from 'react';
import { X, Download, FileText, CheckCircle2, ExternalLink, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { DatasetState, AnalysisPackage } from '../types/data';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlobUrl: string | null;
  onDownload: () => void;
  datasetState: DatasetState;
  analysis: AnalysisPackage;
  filename?: string;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfBlobUrl,
  onDownload,
  datasetState,
  analysis,
  filename = 'Executive_Report.pdf',
}) => {
  const [activePage, setActivePage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  if (!isOpen) return null;

  const kpis = analysis.kpis || [];
  const insights = analysis.insights || [];
  const recommendations = analysis.recommendations || [];
  const queries = analysis.queries || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#F97316]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111] truncate max-w-xs sm:max-w-md">
                Document Preview: {filename}
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Interactive multi-page executive layout preview before saving.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {pdfBlobUrl && (
              <a
                href={pdfBlobUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                title="Open PDF file directly in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
            )}

            <button
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Page jump and Zoom controls */}
        <div className="px-5 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Page Navigation:</span>
            <button
              onClick={() => setActivePage(1)}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                activePage === 1 ? 'bg-[#F97316] text-white font-bold' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Page 1 (Summary & KPIs)
            </button>
            <button
              onClick={() => setActivePage(2)}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                activePage === 2 ? 'bg-[#F97316] text-white font-bold' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Page 2 (SQL Evidence & Audit)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomScale(z => Math.max(0.75, z - 0.1))}
              className="p-1 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] w-12 text-center">{Math.round(zoomScale * 100)}%</span>
            <button
              onClick={() => setZoomScale(z => Math.min(1.3, z + 0.1))}
              className="p-1 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Paper Document Canvas Viewer */}
        <div className="flex-1 bg-[#525659] p-4 sm:p-8 overflow-y-auto flex flex-col items-center">
          <div
            className="w-full max-w-3xl bg-white shadow-2xl rounded-sm p-8 sm:p-12 text-[#111111] transition-transform origin-top duration-150"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {activePage === 1 ? (
              /* ==========================================
                 PAGE 1: Executive Summary, KPIs & Insights
                 ========================================== */
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                  <div className="w-2 h-16 bg-[#F97316] rounded-full flex-shrink-0" />
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
                      ASK AFEELIA DATA WORLD
                    </h1>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Executive Diagnostic Report • Generated {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Context Box */}
                <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-orange-100 text-[#F97316] font-bold text-[10px] tracking-wider uppercase flex-shrink-0">
                      Problem
                    </span>
                    <p className="text-xs font-semibold text-[#111111]">
                      {datasetState.businessProblem || 'Not specified'}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-orange-100 text-[#F97316] font-bold text-[10px] tracking-wider uppercase flex-shrink-0">
                      Objective
                    </span>
                    <p className="text-xs text-[#111111]">
                      {datasetState.objective || 'Not specified'}
                    </p>
                  </div>

                  {datasetState.desiredKpis && (
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-[#F97316] font-bold text-[10px] tracking-wider uppercase flex-shrink-0">
                        Target KPIs
                      </span>
                      <p className="text-xs text-[#111111] font-mono">
                        {datasetState.desiredKpis}
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 1: KPI Table (Exact Values) */}
                <div className="space-y-2 pt-2">
                  <h2 className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                    1. Executive KPI Scorecard (Exact Figures)
                  </h2>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F97316] text-white text-[10px] uppercase font-bold">
                        <tr>
                          <th className="px-3 py-2">Metric / KPI</th>
                          <th className="px-3 py-2">Exact Value</th>
                          <th className="px-3 py-2">Trajectory / Variance</th>
                          <th className="px-3 py-2">Underlying SQL Logic</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                        {kpis.map((kpi, i) => (
                          <tr key={i} className={i % 2 === 1 ? 'bg-[#FEFAF5]' : 'bg-white'}>
                            <td className="px-3 py-2 font-sans font-bold text-[#111111]">{kpi.title}</td>
                            <td className="px-3 py-2 font-bold text-[#F97316]">{kpi.computedValue}</td>
                            <td className="px-3 py-2 font-sans font-medium text-emerald-700">{kpi.change || 'Baseline'}</td>
                            <td className="px-3 py-2 text-gray-500 text-[10px] max-w-[200px] truncate" title={kpi.sql}>{kpi.sql}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: Key Insights */}
                <div className="space-y-2 pt-2">
                  <h2 className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                    2. Key Strategic Insights
                  </h2>
                  <div className="space-y-2">
                    {insights.map((ins, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-[#111111]">
                        <span className="w-2 h-2 rounded-full bg-[#F97316] mt-1.5 flex-shrink-0" />
                        <p className="leading-relaxed">{ins}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Recommendations */}
                <div className="space-y-2 pt-2">
                  <h2 className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                    3. Actionable Recommendations
                  </h2>
                  <div className="space-y-2">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-[#111111]">
                        <span className="font-bold text-[#F97316] text-xs">Step 0{i + 1}:</span>
                        <p className="leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Page 1 Footer */}
                <div className="pt-8 mt-8 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400">
                  <span>ASK AFEELIA DATA WORLD — Executive Confidential Diagnostic</span>
                  <span>Page 1 of 2</span>
                </div>
              </div>
            ) : (
              /* ==========================================
                 PAGE 2: SQL Diagnostic Queries & Audit
                 ========================================== */
              <div className="space-y-6">
                <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                  <div className="w-2 h-16 bg-[#F97316] rounded-full flex-shrink-0" />
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
                      SQL Diagnostics & Evidence
                    </h1>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Query Execution and Hygiene Audit • Table: dataset
                    </p>
                  </div>
                </div>

                {/* Section 4: SQL Queries */}
                <div className="space-y-4">
                  <h2 className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                    4. Diagnostic SQL Queries & Result Tables
                  </h2>

                  {queries.map((q, idx) => (
                    <div key={q.id || idx} className="space-y-1.5 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111111]">{q.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Query #{idx + 1}</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280]">{q.explanation}</p>
                      <pre className="p-2 rounded bg-white border border-gray-200 font-mono text-[10px] text-gray-800 overflow-x-auto">
                        <code>{q.sql}</code>
                      </pre>

                      {q.results && q.results.length > 0 ? (() => {
                        const results = q.results;
                        const headers = Object.keys(results[0]).slice(0, 5);
                        return (
                          <div className="border border-gray-200 rounded overflow-hidden mt-1">
                            <table className="w-full text-left text-[10px] border-collapse">
                              <thead className="bg-gray-800 text-white font-bold">
                                <tr>
                                  {headers.map(h => (
                                    <th key={h} className="px-2 py-1">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 font-mono bg-white">
                                {results.slice(0, 4).map((r, rIdx) => (
                                  <tr key={rIdx}>
                                    {headers.map(h => (
                                      <td key={h} className="px-2 py-1">{String(r[h] ?? '-')}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })() : null}
                    </div>
                  ))}
                </div>

                {/* Section 5: Dataset Audit */}
                <div className="space-y-2 pt-2">
                  <h2 className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                    5. Dataset Audit Summary
                  </h2>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F97316] text-white text-[10px] uppercase font-bold">
                        <tr>
                          <th className="px-3 py-1.5">Audit Dimension</th>
                          <th className="px-3 py-1.5">Normalized Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-[11px]">
                        <tr>
                          <td className="px-3 py-1.5 font-bold">Filename</td>
                          <td className="px-3 py-1.5 font-mono">{datasetState.filename}</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-3 py-1.5 font-bold">Total Records</td>
                          <td className="px-3 py-1.5 font-mono">{datasetState.stats.totalRows.toLocaleString()} rows</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-1.5 font-bold">Features Audited</td>
                          <td className="px-3 py-1.5 font-mono">{datasetState.stats.columnsCount} columns</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-3 py-1.5 font-bold">Blanks Handled</td>
                          <td className="px-3 py-1.5 font-mono text-orange-600">{datasetState.stats.blanksCleaned} entries</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-1.5 font-bold">Duplicates Filtered</td>
                          <td className="px-3 py-1.5 font-mono text-emerald-600">{datasetState.stats.duplicatesRemoved} duplicate rows</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Page 2 Footer */}
                <div className="pt-8 mt-8 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400">
                  <span>ASK AFEELIA DATA WORLD — Executive Confidential Diagnostic</span>
                  <span>Page 2 of 2</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-[#6B7280] flex-shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Verified layout with exact unrounded KPI values and dynamic zero-overflow bounding
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePage(p => (p === 1 ? 2 : 1))}
              className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              Switch to Page {activePage === 1 ? 2 : 1}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-[#111111] hover:bg-gray-100 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
