import React, { useState, useMemo } from 'react';
import { BarChart3, LineChart, PieChart, AlignLeft, Plus, X, Trash2, Palette } from 'lucide-react';
import { ColumnSchema, CustomChartConfig } from '../types/data';
import { BarChartComponent } from './charts/BarChartComponent';
import { LineChartComponent } from './charts/LineChartComponent';
import { DonutChartComponent } from './charts/DonutChartComponent';
import { HorizontalBarChartComponent } from './charts/HorizontalBarChartComponent';

interface CustomChartBuilderProps {
  schema: ColumnSchema[];
  rows: Record<string, any>[];
  customCharts: CustomChartConfig[];
  onAddCustomChart: (chart: CustomChartConfig) => void;
  onRemoveCustomChart: (chartId: string) => void;
}

const COLOR_PALETTES = [
  { name: 'Executive Orange', hex: '#F97316' },
  { name: 'Amber Gold', hex: '#F59E0B' },
  { name: 'Burnt Terracotta', hex: '#EA580C' },
  { name: 'Crimson Rose', hex: '#E11D48' },
  { name: 'Emerald Forest', hex: '#059669' },
  { name: 'Deep Teal', hex: '#0D9488' },
  { name: 'Royal Indigo', hex: '#4F46E5' },
  { name: 'Midnight Slate', hex: '#374151' },
];

export const CustomChartBuilder: React.FC<CustomChartBuilderProps> = ({
  schema,
  rows,
  customCharts,
  onAddCustomChart,
  onRemoveCustomChart,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const catCols = useMemo(
    () => schema.filter(c => c.type === 'string' || c.type === 'date'),
    [schema]
  );
  const numCols = useMemo(() => schema.filter(c => c.type === 'number'), [schema]);

  const defaultDim = catCols[0]?.name || schema[0]?.name || '';
  const defaultMetric = numCols[0]?.name || numCols[1]?.name || schema[1]?.name || '';

  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'donut' | 'horizontal_bar'>('bar');
  const [xDimension, setXDimension] = useState(defaultDim);
  const [yMetric, setYMetric] = useState(defaultMetric);
  const [aggregation, setAggregation] = useState<'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX'>('SUM');
  const [selectedColor, setSelectedColor] = useState<string>('#F97316');

  // Compute chart data given config and rows
  const computeChartData = (
    dimCol: string,
    metCol: string,
    agg: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX'
  ) => {
    if (!dimCol || !rows || rows.length === 0) return [];

    const map = new Map<string, { sum: number; count: number; min: number; max: number }>();

    rows.forEach(r => {
      const dim = String(r[dimCol] ?? 'Other');
      const val = Number(r[metCol]) || 0;

      if (!map.has(dim)) {
        map.set(dim, { sum: val, count: 1, min: val, max: val });
      } else {
        const item = map.get(dim)!;
        item.sum += val;
        item.count += 1;
        item.min = Math.min(item.min, val);
        item.max = Math.max(item.max, val);
      }
    });

    const entries = Array.from(map.entries()).map(([label, stats]) => {
      let finalVal = stats.sum;
      if (agg === 'AVG') finalVal = stats.count > 0 ? stats.sum / stats.count : 0;
      if (agg === 'COUNT') finalVal = stats.count;
      if (agg === 'MIN') finalVal = stats.min;
      if (agg === 'MAX') finalVal = stats.max;

      // Keep precision, do not round up
      const hasDec = finalVal % 1 !== 0;
      const precisionVal = hasDec ? Math.round(finalVal * 100) / 100 : finalVal;

      return {
        label,
        value: precisionVal,
      };
    });

    return entries.sort((a, b) => b.value - a.value).slice(0, 10);
  };

  const previewData = useMemo(() => {
    return computeChartData(xDimension || defaultDim, yMetric || defaultMetric, aggregation);
  }, [xDimension, yMetric, aggregation, rows, defaultDim, defaultMetric]);

  const handleSave = () => {
    const finalTitle =
      title.trim() ||
      `${aggregation} of ${yMetric.replace(/_/g, ' ')} by ${xDimension.replace(/_/g, ' ')}`;

    const newChart: CustomChartConfig = {
      id: `custom-${Date.now()}`,
      title: finalTitle,
      type: chartType,
      xDimension: xDimension || defaultDim,
      yMetric: yMetric || defaultMetric,
      aggregation,
      color: selectedColor,
    };

    onAddCustomChart(newChart);
    setTitle('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#111111]">Custom Visualizations</h3>
          <p className="text-xs text-[#6B7280]">
            Build tailored charts with customizable color palettes, download capability, and dynamic aggregation.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 font-semibold rounded-xl text-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          {isOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isOpen ? 'Close Builder' : '+ Create Custom Chart'}</span>
        </button>
      </div>

      {/* Chart Builder Drawer / Panel */}
      {isOpen && (
        <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h4 className="text-sm font-bold text-[#111111]">Chart Configuration</h4>
            <span className="text-xs text-[#6B7280]">Real-time preview below</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chart Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-700 uppercase">
                Chart Type
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    chartType === 'bar'
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-gray-200 text-[#111111] hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
                  <span>Vertical Bar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('line')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    chartType === 'line'
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-gray-200 text-[#111111] hover:bg-gray-50'
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5 text-orange-500" />
                  <span>Line Trend</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('donut')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    chartType === 'donut'
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-gray-200 text-[#111111] hover:bg-gray-50'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5 text-orange-500" />
                  <span>Donut / Pie</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('horizontal_bar')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    chartType === 'horizontal_bar'
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-gray-200 text-[#111111] hover:bg-gray-50'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5 text-orange-500" />
                  <span>Horizontal Bar</span>
                </button>
              </div>
            </div>

            {/* Dimension (X-Axis) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-700 uppercase">
                X-Axis Dimension (Group By)
              </label>
              <select
                value={xDimension}
                onChange={e => setXDimension(e.target.value)}
                className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
              >
                {schema.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Metric (Y-Axis) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-700 uppercase">
                Y-Axis Metric (Value)
              </label>
              <select
                value={yMetric}
                onChange={e => setYMetric(e.target.value)}
                className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
              >
                {numCols.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Aggregation */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-700 uppercase">
                Aggregation Function
              </label>
              <select
                value={aggregation}
                onChange={e => setAggregation(e.target.value as any)}
                className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
              >
                <option value="SUM">SUM (Total)</option>
                <option value="AVG">AVG (Average)</option>
                <option value="COUNT">COUNT (Frequency)</option>
                <option value="MAX">MAX (Peak)</option>
                <option value="MIN">MIN (Floor)</option>
              </select>
            </div>
          </div>

          {/* Color Palette Selector */}
          <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-orange-600" />
              <label className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                Select Chart Color Palette
              </label>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTES.map(p => (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => setSelectedColor(p.hex)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    selectedColor.toLowerCase() === p.hex.toLowerCase()
                      ? 'border-gray-900 bg-white ring-2 ring-orange-500 font-bold'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.hex }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}

              {/* Native Custom Color Picker */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-gray-300">
                <span className="text-xs text-gray-600">Custom:</span>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={e => setSelectedColor(e.target.value)}
                  className="w-7 h-7 p-0.5 rounded border border-gray-300 cursor-pointer bg-white"
                />
              </div>
            </div>
          </div>

          {/* Optional Title input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-gray-700 uppercase">
              Custom Chart Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`e.g. ${aggregation} of ${yMetric} by ${xDimension}`}
              className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Live Preview Block */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Live Preview:
            </span>
            {chartType === 'bar' && (
              <BarChartComponent
                title={title || `${aggregation} of ${yMetric} by ${xDimension}`}
                data={previewData}
                height={220}
                color={selectedColor}
              />
            )}
            {chartType === 'line' && (
              <LineChartComponent
                title={title || `${aggregation} of ${yMetric} by ${xDimension}`}
                data={previewData}
                height={220}
                color={selectedColor}
              />
            )}
            {chartType === 'donut' && (
              <DonutChartComponent
                title={title || `${aggregation} of ${yMetric} by ${xDimension}`}
                data={previewData}
                height={220}
                color={selectedColor}
              />
            )}
            {chartType === 'horizontal_bar' && (
              <HorizontalBarChartComponent
                title={title || `${aggregation} of ${yMetric} by ${xDimension}`}
                data={previewData}
                color={selectedColor}
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-none"
            >
              Add to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Render Active Custom Charts */}
      {customCharts && customCharts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {customCharts.map(cc => {
            const data = computeChartData(cc.xDimension, cc.yMetric, cc.aggregation);
            const chartColor = cc.color || '#F97316';

            return (
              <div key={cc.id} className="relative group">
                <button
                  onClick={() => onRemoveCustomChart(cc.id)}
                  className="absolute top-4 right-12 z-10 p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Remove this custom chart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {cc.type === 'bar' && (
                  <BarChartComponent
                    title={cc.title}
                    subtitle={`${cc.aggregation} of ${cc.yMetric} grouped by ${cc.xDimension}`}
                    data={data}
                    color={chartColor}
                  />
                )}
                {cc.type === 'line' && (
                  <LineChartComponent
                    title={cc.title}
                    subtitle={`${cc.aggregation} of ${cc.yMetric} grouped by ${cc.xDimension}`}
                    data={data}
                    color={chartColor}
                  />
                )}
                {cc.type === 'donut' && (
                  <DonutChartComponent
                    title={cc.title}
                    subtitle={`${cc.aggregation} of ${cc.yMetric} grouped by ${cc.xDimension}`}
                    data={data}
                    color={chartColor}
                  />
                )}
                {cc.type === 'horizontal_bar' && (
                  <HorizontalBarChartComponent
                    title={cc.title}
                    subtitle={`${cc.aggregation} of ${cc.yMetric} grouped by ${cc.xDimension}`}
                    data={data}
                    color={chartColor}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
