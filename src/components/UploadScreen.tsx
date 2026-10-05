import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, CheckCircle2, ArrowRight, Layers, Database, Table, Cloud } from 'lucide-react';
import { DatasetState } from '../types/data';
import { SAMPLE_DATASETS, SampleDataset } from '../utils/sampleDatasets';
import { parseFile, extractAndCleanSheet, cleanRawRows } from '../utils/dataProcessor';
import { ManualDataEntry } from './ManualDataEntry';

interface UploadScreenProps {
  datasetState: DatasetState;
  setDatasetState: React.Dispatch<React.SetStateAction<DatasetState>>;
  onAnalyze: (customProblem?: string, customObjective?: string, customDesiredKpis?: string) => Promise<void>;
  workbookRef: React.MutableRefObject<any>;
  onOpenSupabase?: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
  datasetState,
  setDatasetState,
  onAnalyze,
  workbookRef,
  onOpenSupabase,
}) => {
  const [inputMode, setInputMode] = useState<'upload' | 'manual'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setErrorMessage('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    try {
      setIsProcessingFile(true);
      setErrorMessage(null);
      const parsed = await parseFile(file);
      workbookRef.current = parsed.workbook;

      setDatasetState(prev => ({
        ...prev,
        filename: file.name,
        sheets: parsed.sheets,
        activeSheet: parsed.activeSheet,
        schema: parsed.schema,
        rows: parsed.rows,
        stats: parsed.stats,
        analysis: null,
      }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing the file. Please check format.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSelectSample = (sample: SampleDataset) => {
    setErrorMessage(null);
    const { rows, schema, stats } = cleanRawRows(sample.rows, ['Sheet1'], 'Sheet1');
    workbookRef.current = null;

    setDatasetState(prev => ({
      ...prev,
      filename: sample.filename,
      sheets: ['Sheet1'],
      activeSheet: 'Sheet1',
      schema,
      rows,
      stats,
      businessProblem: sample.problem,
      objective: sample.objective,
      analysis: null,
    }));
  };

  const handleSheetChange = (sheetName: string) => {
    if (!workbookRef.current) return;
    try {
      const { rows, schema, stats } = extractAndCleanSheet(
        workbookRef.current,
        sheetName,
        datasetState.sheets
      );
      setDatasetState(prev => ({
        ...prev,
        activeSheet: sheetName,
        schema,
        rows,
        stats,
        analysis: null,
      }));
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleManualDataCommit = (rows: Record<string, any>[], schema: any[], stats: any) => {
    workbookRef.current = null;
    setDatasetState(prev => ({
      ...prev,
      filename: 'Manual_Data_Input.csv',
      sheets: ['ManualEntry'],
      activeSheet: 'ManualEntry',
      schema,
      rows,
      stats,
      analysis: null,
    }));
  };

  const hasData = datasetState.rows.length > 0;
  const previewRows = datasetState.rows.slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Introduction */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#111111]">
          Instant Diagnostic Analytics & SQL
        </h1>
        <p className="text-sm text-[#6B7280]">
          Upload your business data or enter records manually, state your business problem and desired KPIs, and receive instant executive dashboards, SQL diagnostic queries, PPTX slides, and an AI data agent.
        </p>
      </div>

      {/* Preset Dataset Pills for Instant 1-Click Evaluation */}
      <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F97316] flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#111111]">
              Try a Curated Sample Dataset:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_DATASETS.map(sample => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  datasetState.filename === sample.filename
                    ? 'bg-[#F97316] text-white border-[#F97316]'
                    : 'bg-white text-[#111111] border-gray-200 hover:border-orange-400 hover:bg-orange-50/30'
                }`}
              >
                {sample.name}
              </button>
            ))}

            {onOpenSupabase && (
              <button
                onClick={onOpenSupabase}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5"
                title="Browse or load datasets stored in Supabase"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supabase Projects</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mode Switcher: File Upload vs Manual Data Entry */}
      <div className="flex items-center justify-center">
        <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
          <button
            onClick={() => setInputMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              inputMode === 'upload'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Upload File (.xlsx, .xls, .csv)</span>
          </button>

          <button
            onClick={() => setInputMode('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              inputMode === 'manual'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Enter Data Manually</span>
          </button>
        </div>
      </div>

      {/* Main Section */}
      {inputMode === 'manual' ? (
        <div className="space-y-6">
          <ManualDataEntry onCommitData={handleManualDataCommit} />

          {/* Problem & Objective Card underneath manual entry */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-bold text-[#111111] pb-2 border-b border-gray-100">
              Analysis Objectives & Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]">
                  1. Business Problem
                </label>
                <input
                  type="text"
                  value={datasetState.businessProblem}
                  onChange={e => setDatasetState(prev => ({ ...prev, businessProblem: e.target.value }))}
                  placeholder="e.g. Why are sales declining in the North?"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#F97316] transition-colors"
                />
                <p className="text-[11px] text-[#6B7280]">
                  State the core business question or friction.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]">
                  2. Objective
                </label>
                <input
                  type="text"
                  value={datasetState.objective}
                  onChange={e => setDatasetState(prev => ({ ...prev, objective: e.target.value }))}
                  placeholder="e.g. Identify the top 3 drivers of decline."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#F97316] transition-colors"
                />
                <p className="text-[11px] text-[#6B7280]">
                  Specify target findings and drivers.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]">
                  3. Target / Desired KPIs
                </label>
                <input
                  type="text"
                  value={datasetState.desiredKpis || ''}
                  onChange={e => setDatasetState(prev => ({ ...prev, desiredKpis: e.target.value }))}
                  placeholder="e.g. Total North Revenue, Return Rate %, Margin %, Units Sold"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#F97316] transition-colors"
                />
                <p className="text-[11px] text-[#6B7280]">
                  State your desired metrics for the scorecard.
                </p>
              </div>
            </div>

            <button
              onClick={() => onAnalyze(datasetState.businessProblem, datasetState.objective, datasetState.desiredKpis)}
              disabled={!hasData || datasetState.isAnalyzing}
              className="w-full py-3 px-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
            >
              {datasetState.isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Diagnostics & SQL...</span>
                </>
              ) : (
                <>
                  <span>Analyze Dataset</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onOpenSupabase && hasData && (
              <button
                type="button"
                onClick={onOpenSupabase}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-emerald-200 mt-2"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Save to Supabase Cloud</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Drag & Drop Area */}
          <div className="lg:col-span-6 space-y-4">
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[280px] ${
                isDragging
                  ? 'border-[#F97316] bg-orange-50/40'
                  : hasData
                  ? 'border-orange-300 bg-white hover:border-[#F97316]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-orange-100/70 flex items-center justify-center text-[#F97316] mb-4">
                {isProcessingFile ? (
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : hasData ? (
                  <FileSpreadsheet className="w-7 h-7" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>

              <h3 className="text-base font-semibold text-[#111111]">
                {hasData ? datasetState.filename : 'Upload your dataset'}
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-sm">
                Drag & drop Excel (.xlsx, .xls) or CSV files here, or click to browse. Multiple sheets supported.
              </p>

              {hasData && (
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {datasetState.stats.totalRows.toLocaleString()} rows ready
                </span>
              )}
            </div>

            {/* Multi-Sheet Selector if multiple sheets exist */}
            {datasetState.sheets.length > 1 && (
              <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                <Layers className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-[#111111]">Active Sheet:</span>
                <div className="flex flex-wrap gap-1.5">
                  {datasetState.sheets.map(sheet => (
                    <button
                      key={sheet}
                      onClick={() => handleSheetChange(sheet)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                        datasetState.activeSheet === sheet
                          ? 'bg-[#F97316] text-white'
                          : 'bg-gray-100 text-[#111111] hover:bg-gray-200'
                      }`}
                    >
                      {sheet}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Right Column: Problem, Objective, Desired KPI & Action */}
          <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]">
                1. Business Problem
              </label>
              <input
                type="text"
                value={datasetState.businessProblem}
                onChange={e => setDatasetState(prev => ({ ...prev, businessProblem: e.target.value }))}
                placeholder="e.g. Why are sales declining in the North?"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#F97316] transition-colors"
              />
              <p className="text-[11px] text-[#6B7280]">
                State the exact business symptom or friction you want diagnosed.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]">
                2. Objective
              </label>
              <input
                type="text"
                value={datasetState.objective}
                onChange={e => setDatasetState(prev => ({ ...prev, objective: e.target.value }))}
                placeholder="e.g. Identify the top 3 drivers of decline."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#F97316] transition-colors"
              />
              <p className="text-[11px] text-[#6B7280]">
                Specify what answers or root causes you want the analysis and SQL to uncover.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]">
                3. Target / Desired KPIs (Optional)
              </label>
              <input
                type="text"
                value={datasetState.desiredKpis || ''}
                onChange={e => setDatasetState(prev => ({ ...prev, desiredKpis: e.target.value }))}
                placeholder="e.g. Total North Revenue, Return Rate %, Margin %, Units Sold vs Target"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#F97316] transition-colors"
              />
              <p className="text-[11px] text-[#6B7280]">
                State the specific metrics you want featured in your 4 executive scorecard cards.
              </p>
            </div>

            <button
              onClick={() => onAnalyze(datasetState.businessProblem, datasetState.objective, datasetState.desiredKpis)}
              disabled={!hasData || datasetState.isAnalyzing}
              className="w-full py-3 px-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
            >
              {datasetState.isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Diagnostics & SQL...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onOpenSupabase && hasData && (
              <button
                type="button"
                onClick={onOpenSupabase}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-emerald-200 mt-2"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Save to Supabase Cloud</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cleaned Data Summary Banner & Data Preview */}
      {hasData && (
        <div className="space-y-4">
          {/* Cleaning Summary Pill Cards */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#111111]">
                Automated Data Hygiene & Cleaning Audit
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[#6B7280] block text-[11px]">Valid Records</span>
                <span className="text-base font-bold text-[#111111]">
                  {datasetState.stats.totalRows.toLocaleString()} rows
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[#6B7280] block text-[11px]">Features Normalized</span>
                <span className="text-base font-bold text-[#111111]">
                  {datasetState.stats.columnsCount} columns
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[#6B7280] block text-[11px]">Blanks Imputed</span>
                <span className="text-base font-bold text-orange-600">
                  {datasetState.stats.blanksCleaned} values
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="text-[#6B7280] block text-[11px]">Duplicates Removed</span>
                <span className="text-base font-bold text-emerald-600">
                  {datasetState.stats.duplicatesRemoved} rows
                </span>
              </div>
            </div>
          </div>

          {/* First 10 Rows Preview */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#111111]">Dataset Preview</h3>
                <p className="text-xs text-[#6B7280]">
                  Showing first {previewRows.length} cleaned rows loaded into table "dataset"
                </p>
              </div>
              <span className="text-xs font-medium text-gray-500">
                {datasetState.schema.length} fields detected
              </span>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {datasetState.schema.map(col => (
                      <th key={col.name} className="px-3.5 py-2.5 font-semibold text-[#111111] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{col.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-normal uppercase bg-orange-100 text-orange-800">
                            {col.type}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                      {datasetState.schema.map(col => (
                        <td key={col.name} className="px-3.5 py-2 text-[#111111] whitespace-nowrap font-mono text-[11px]">
                          {row[col.name] !== null && row[col.name] !== undefined
                            ? String(row[col.name])
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
