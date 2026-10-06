export type ColumnType = 'string' | 'number' | 'date' | 'boolean';

export interface ColumnSchema {
  name: string;
  originalName: string;
  type: ColumnType;
  sampleValues: any[];
  distinctCount?: number;
  nullCount?: number;
}

export interface CleaningStats {
  totalRows: number;
  columnsCount: number;
  blanksCleaned: number;
  duplicatesRemoved: number;
  sheetsFound: string[];
  activeSheet: string;
}

export interface KpiMetric {
  id: string;
  title: string;
  sql: string;
  computedValue?: string | number;
  format?: 'currency' | 'percent' | 'number' | 'count';
  change?: string;
  isPositive?: boolean;
}

export interface SqlQueryItem {
  id: string;
  title: string;
  explanation: string;
  sql: string;
  results?: any[];
  error?: string | null;
}

export interface AnalysisPackage {
  kpis: KpiMetric[];
  insights: string[];
  recommendations: string[];
  suggestedQuestions: string[];
  queries: SqlQueryItem[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  timestamp: string;
  text: string;
  sql?: string;
  sqlExplanation?: string;
  canAnswer?: boolean;
  queryResults?: any[];
  chartType?: 'bar' | 'line' | 'donut' | 'table';
  calculatedCard?: {
    entity?: string;
    metricLabel?: string;
    value?: string | number;
    subtext?: string;
  };
}

export type FilterOperator = 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_equals';

export interface CustomFilterRule {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

export interface CustomChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'donut' | 'horizontal_bar';
  xDimension: string;
  yMetric: string;
  aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  color?: string;
}

export interface DatasetState {
  filename: string;
  sheets: string[];
  activeSheet: string;
  schema: ColumnSchema[];
  rows: Record<string, any>[];
  stats: CleaningStats;
  businessProblem: string;
  objective: string;
  desiredKpis?: string;
  customCharts?: CustomChartConfig[];
  analysis: AnalysisPackage | null;
  isAnalyzing: boolean;
}
