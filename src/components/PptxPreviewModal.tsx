import React, { useState } from 'react';
import { X, Download, Presentation, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { DatasetState, AnalysisPackage } from '../types/data';

interface PptxPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetState: DatasetState;
  analysis: AnalysisPackage;
  onDownload: () => Promise<void>;
  isDownloading: boolean;
}

export const PptxPreviewModal: React.FC<PptxPreviewModalProps> = ({
  isOpen,
  onClose,
  datasetState,
  analysis,
  onDownload,
  isDownloading,
}) => {
  const [activeSlide, setActiveSlide] = useState(1);

  if (!isOpen) return null;

  const totalSlides = 7;
  const kpis = (analysis.kpis || []).slice(0, 4);
  const insights = (analysis.insights || []).slice(0, 4);
  const recommendations = (analysis.recommendations || []).slice(0, 3);
  const firstQuery = (analysis.queries && analysis.queries[0]) || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#F97316]">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">
                Presentation Slides Preview (16:9 Deck)
              </h3>
              <p className="text-xs text-[#6B7280]">
                Interactive preview of executive slides before downloading .pptx
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Building Deck...' : 'Download Slides (.pptx)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Thumbnails + Right Slide Canvas */}
        <div className="flex-1 flex overflow-hidden bg-gray-100">
          {/* Thumbnails Sidebar */}
          <div className="w-48 sm:w-56 bg-white border-r border-gray-200 p-3 overflow-y-auto space-y-2 flex-shrink-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-2 mb-2">
              Slides ({totalSlides})
            </span>
            {[
              { num: 1, title: 'Title & Diagnostic' },
              { num: 2, title: 'Business Context' },
              { num: 3, title: 'KPI Scorecard' },
              { num: 4, title: 'Key Insights' },
              { num: 5, title: 'Data Evidence Table' },
              { num: 6, title: 'Strategic Recommendations' },
              { num: 7, title: 'Next Steps & Roadmap' },
            ].map(s => (
              <button
                key={s.num}
                onClick={() => setActiveSlide(s.num)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  activeSlide === s.num
                    ? 'border-[#F97316] bg-orange-50/60 font-bold text-[#111111]'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>Slide 0{s.num}</span>
                  {activeSlide === s.num && (
                    <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                  )}
                </div>
                <div className="truncate">{s.title}</div>
              </button>
            ))}
          </div>

          {/* Main Slide Canvas */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-auto">
            {/* 16:9 Aspect Ratio Slide Canvas */}
            <div className="w-full max-w-4xl aspect-[16/9] bg-white border border-gray-300 rounded-xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
              {/* SLIDE 1: Cover Slide */}
              {activeSlide === 1 && (
                <div className="h-full flex flex-col justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-24 bg-[#F97316] rounded-full" />
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                        ASK AFEELIA DATA WORLD
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">
                        Executive Data Intelligence & Diagnostic Review
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-4 my-auto max-w-2xl">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-[10px] font-bold text-[#F97316] uppercase">Problem:</span>
                      <p className="text-sm font-semibold text-[#111111]">
                        "{datasetState.businessProblem || 'Operational Performance Review'}"
                      </p>
                    </div>

                    <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 space-y-1">
                      <span className="text-[10px] font-bold text-[#F97316] uppercase">Objective:</span>
                      <p className="text-xs text-[#111111]">
                        {datasetState.objective || 'Identify top drivers and root causes'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                    <span>Dataset: {datasetState.filename}</span>
                    <span>Generated {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {/* SLIDE 2: Business Context */}
              {activeSlide === 2 && (
                <div className="h-full flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                      Context & Objectives
                    </span>
                    <h3 className="text-xl font-bold text-[#111111]">
                      Business Problem & Diagnostic Scope
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-5 flex-1">
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#F97316] uppercase">The Problem</span>
                        <p className="text-sm font-bold text-[#111111] mt-2 leading-relaxed">
                          {datasetState.businessProblem}
                        </p>
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        Directly impacts segment realization, variance, and operating margin.
                      </p>
                    </div>

                    <div className="p-5 bg-orange-50/40 rounded-xl border border-orange-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#F97316] uppercase">Analysis Objective</span>
                        <p className="text-sm font-bold text-[#111111] mt-2 leading-relaxed">
                          {datasetState.objective}
                        </p>
                      </div>
                      <div className="text-xs text-[#111111] space-y-0.5">
                        <div>• Records audited: {datasetState.stats.totalRows.toLocaleString()} rows</div>
                        <div>• Features normalized: {datasetState.stats.columnsCount} columns</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-gray-400">Slide 2 of 7</div>
                </div>
              )}

              {/* SLIDE 3: KPI Scorecard */}
              {activeSlide === 3 && (
                <div className="h-full flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                      Performance Scorecard
                    </span>
                    <h3 className="text-xl font-bold text-[#111111]">
                      Executive KPI Scorecard (Exact Figures)
                    </h3>
                  </div>

                  <div className="grid grid-cols-4 gap-3 my-auto">
                    {kpis.map((k, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between space-y-3">
                        <span className="text-[10px] font-bold text-[#F97316] uppercase truncate">
                          {k.title}
                        </span>
                        <div className="text-xl sm:text-2xl font-bold text-[#111111] font-mono">
                          {k.computedValue}
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 truncate">
                          {k.change || 'Baseline Metric'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-right text-xs text-gray-400">Slide 3 of 7</div>
                </div>
              )}

              {/* SLIDE 4: Key Insights */}
              {activeSlide === 4 && (
                <div className="h-full flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                      Diagnostic Synthesis
                    </span>
                    <h3 className="text-xl font-bold text-[#111111]">
                      Key Strategic Insights
                    </h3>
                  </div>

                  <div className="space-y-2.5 my-auto">
                    {insights.map((ins, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-[#111111]">
                        <span className="w-5 h-5 rounded-full bg-[#F97316] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="leading-relaxed">{ins}</p>
                      </div>
                    ))}
                  </div>

                  <div className="text-right text-xs text-gray-400">Slide 4 of 7</div>
                </div>
              )}

              {/* SLIDE 5: Data Evidence Table */}
              {activeSlide === 5 && (
                <div className="h-full flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                      Data Evidence
                    </span>
                    <h3 className="text-xl font-bold text-[#111111]">
                      {firstQuery ? firstQuery.title : 'Primary Aggregations'}
                    </h3>
                  </div>

                  {firstQuery && firstQuery.results && firstQuery.results.length > 0 ? (() => {
                    const results = firstQuery.results;
                    const headers = Object.keys(results[0]).slice(0, 5);
                    return (
                      <div className="overflow-x-auto border border-gray-200 rounded-lg text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 text-[10px] uppercase font-bold text-[#111111]">
                            <tr>
                              {headers.map(h => (
                                <th key={h} className="p-2 border-b border-gray-200">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                            {results.slice(0, 5).map((row, rIdx) => (
                              <tr key={rIdx}>
                                {headers.map(h => (
                                  <td key={h} className="p-2">{String(row[h] ?? '-')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })() : (
                    <div className="p-8 text-center text-xs text-gray-400">Standard summary table</div>
                  )}

                  <div className="text-right text-xs text-gray-400">Slide 5 of 7</div>
                </div>
              )}

              {/* SLIDE 6: Recommendations */}
              {activeSlide === 6 && (
                <div className="h-full flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                      Actionable Roadmap
                    </span>
                    <h3 className="text-xl font-bold text-[#111111]">
                      Strategic Recommendations
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4 my-auto">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="p-4 bg-orange-50/40 rounded-xl border border-orange-200 flex flex-col justify-between space-y-3">
                        <span className="text-xs font-bold text-[#F97316]">
                          PRIORITY 0{i + 1}
                        </span>
                        <p className="text-xs text-[#111111] leading-relaxed">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="text-right text-xs text-gray-400">Slide 6 of 7</div>
                </div>
              )}

              {/* SLIDE 7: Next Steps */}
              {activeSlide === 7 && (
                <div className="h-full flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                      Execution
                    </span>
                    <h3 className="text-xl font-bold text-[#111111]">
                      Implementation Roadmap & Monitoring
                    </h3>
                  </div>

                  <div className="space-y-3 my-auto">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-4">
                      <span className="text-xs font-bold text-[#F97316] w-28 flex-shrink-0">Immediate (W1-2)</span>
                      <p className="text-xs text-[#111111]">Isolate critical variance drivers identified in SQL queries and initiate operational reviews.</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-4">
                      <span className="text-xs font-bold text-[#F97316] w-28 flex-shrink-0">Short Term (M1)</span>
                      <p className="text-xs text-[#111111]">Deploy automated threshold alerts against leading KPI indicators to curb negative divergence.</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-4">
                      <span className="text-xs font-bold text-[#F97316] w-28 flex-shrink-0">Medium Term (Q1)</span>
                      <p className="text-xs text-[#111111]">Reallocate capital and resources toward resilient segments demonstrating highest margin stability.</p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-gray-400">Slide 7 of 7</div>
                </div>
              )}
            </div>

            {/* Slide Navigation Controls */}
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={() => setActiveSlide(s => Math.max(1, s - 1))}
                disabled={activeSlide === 1}
                className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-[#111111]">
                Slide {activeSlide} of {totalSlides}
              </span>

              <button
                onClick={() => setActiveSlide(s => Math.min(totalSlides, s + 1))}
                disabled={activeSlide === totalSlides}
                className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-[#6B7280] flex-shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Zero-overlap certified layout ready for PowerPoint export
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-[#111111] hover:bg-gray-100 cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
