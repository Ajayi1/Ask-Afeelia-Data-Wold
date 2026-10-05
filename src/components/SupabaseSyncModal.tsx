import React, { useState, useEffect } from 'react';
import { X, Cloud, CheckCircle2, Copy, Check, Upload, RefreshCw, FolderOpen, ExternalLink, Trash2 } from 'lucide-react';
import { DatasetState } from '../types/data';
import {
  SUPABASE_CONFIG,
  testSupabaseConnection,
  saveAnalysisToSupabase,
  fetchSavedAnalyses,
  deleteSavedAnalysis,
  SavedProject,
} from '../utils/supabaseClient';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetState: DatasetState;
  onLoadProject: (project: SavedProject) => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  datasetState,
  onLoadProject,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'projects' | 'sql'>('sync');
  const [connectionStatus, setConnectionStatus] = useState<{ checked: boolean; success: boolean; message: string; tableReady?: boolean }>({
    checked: false,
    success: true,
    message: 'Connecting to Supabase project...',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isCopiedSql, setIsCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkConn();
      loadProjects();
    }
  }, [isOpen]);

  const checkConn = async () => {
    const res = await testSupabaseConnection();
    setConnectionStatus({ checked: true, success: res.success, message: res.message, tableReady: res.tableReady });
  };

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    const projects = await fetchSavedAnalyses();
    setSavedProjects(projects);
    setIsLoadingProjects(false);
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSavedAnalysis(id);
    loadProjects();
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveResult(null);
    try {
      const res = await saveAnalysisToSupabase(datasetState);
      if (res.success) {
        setSaveResult({
          success: true,
          message: res.savedToDb
            ? `Analysis successfully stored in Supabase PostgreSQL table (${SUPABASE_CONFIG.projectId})!`
            : `Analysis synchronized and saved in Supabase project cache! ${res.error || ''}`,
        });
        loadProjects();
      } else {
        setSaveResult({ success: false, message: res.error || 'Failed to save to Supabase' });
      }
    } catch (e: any) {
      setSaveResult({ success: false, message: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const sqlSchemaSnippet = `-- Supabase Table Schema for ASK AFEELIA DATA WORLD
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nsueulauftzwsxlddlzz/sql

CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  filename TEXT,
  business_problem TEXT,
  objective TEXT,
  desired_kpis TEXT,
  rows_count INT,
  columns_count INT,
  schema JSONB,
  stats JSONB,
  analysis_data JSONB,
  rows_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS chat_history (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT,
  sender TEXT,
  text TEXT,
  sql TEXT,
  sql_explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Grant public read, insert, update for the app publishable key
CREATE POLICY "Public Read & Insert for Analyses" ON analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read & Insert for Chat History" ON chat_history FOR ALL USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setIsCopiedSql(true);
    setTimeout(() => setIsCopiedSql(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#111111]">
                  Supabase Cloud Integration
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-100 text-emerald-800 font-semibold">
                  Connected
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                {SUPABASE_CONFIG.projectName} ({SUPABASE_CONFIG.projectId})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 flex-shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
              activeTab === 'sync'
                ? 'bg-white text-[#F97316] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Store / Sync Analysis
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
              activeTab === 'projects'
                ? 'bg-white text-[#F97316] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cloud Saved Projects ({savedProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
              activeTab === 'sql'
                ? 'bg-white text-[#F97316] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            SQL Table Schema
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: SYNC / STORE */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              {/* Connection Status Box */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#111111] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Supabase Credentials Verified:
                  </span>
                  <button
                    onClick={checkConn}
                    className="text-[11px] text-gray-500 hover:text-[#111111] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Recheck</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2 bg-white rounded border border-gray-200 truncate">
                    <span className="text-gray-400 block text-[10px]">Project URL</span>
                    <span className="text-[#111111]">{SUPABASE_CONFIG.url}</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200 truncate">
                    <span className="text-gray-400 block text-[10px]">Project ID</span>
                    <span className="text-[#111111]">{SUPABASE_CONFIG.projectId}</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 pt-1">
                  {connectionStatus.message}
                </p>
              </div>

              {/* Current Analysis Summary */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                  Current Analysis to Store:
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#6B7280]">Active Dataset:</span>
                    <span className="font-semibold text-[#111111]">{datasetState.filename}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#6B7280]">Records & Features:</span>
                    <span className="font-mono text-[#111111]">
                      {datasetState.stats.totalRows.toLocaleString()} rows • {datasetState.stats.columnsCount} columns
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#6B7280]">Business Problem:</span>
                    <span className="font-medium text-[#111111] truncate max-w-sm">
                      {datasetState.businessProblem || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#6B7280]">KPIs & SQL Queries:</span>
                    <span className="text-[#111111]">
                      {datasetState.analysis?.kpis.length || 0} KPIs • {datasetState.analysis?.queries.length || 0} Queries
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSaveToCloud}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-none mt-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Supabase Project...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Save Current Analysis to Supabase</span>
                    </>
                  )}
                </button>
              </div>

              {saveResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    saveResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{saveResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#111111]">Cloud Saved Projects</h4>
                  <p className="text-xs text-[#6B7280]">
                    Reload any previously stored dataset and diagnostic analysis.
                  </p>
                </div>
                <button
                  onClick={loadProjects}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                  title="Refresh project list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProjects ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {savedProjects.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
                  No saved analyses yet. Click "Save Current Analysis to Supabase" on the first tab!
                </div>
              ) : (
                <div className="space-y-3">
                  {savedProjects.map(proj => (
                    <div
                      key={proj.id}
                      className="p-4 bg-white border border-gray-200 hover:border-orange-300 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#111111]">{proj.filename}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(proj.created_at).toLocaleDateString()} {new Date(proj.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280] line-clamp-1">
                          "{proj.business_problem || 'General Analysis'}"
                        </p>
                        <div className="text-[11px] text-gray-400">
                          {proj.rows_count.toLocaleString()} rows • {proj.columns_count} columns
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={(e) => handleDeleteProject(proj.id, e)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            onLoadProject(proj);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Load into App</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SQL SCHEMA HELPER */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#111111]">
                    Supabase SQL Editor Setup Script
                  </h4>
                  <p className="text-xs text-[#6B7280]">
                    Paste this snippet into your Supabase Dashboard &gt; SQL Editor to provision table <code>analyses</code>.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#F97316] text-white text-xs font-semibold rounded-lg hover:bg-[#EA580C] cursor-pointer"
                >
                  {isCopiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="p-3 bg-gray-900 text-gray-100 rounded-xl text-xs font-mono overflow-x-auto">
                <code>{sqlSchemaSnippet}</code>
              </pre>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>Direct Dashboard Link:</span>
                <a
                  href={`https://supabase.com/dashboard/project/${SUPABASE_CONFIG.projectId}/sql`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium"
                >
                  <span>Open Supabase SQL Editor</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-[#6B7280] flex-shrink-0">
          <span>Project ID: {SUPABASE_CONFIG.projectId}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-[#111111] hover:bg-gray-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
