import React, { useState, useRef } from 'react';
import { Download } from 'lucide-react';
import { downloadSvgAsPng } from '../../utils/chartExport';

interface LineDataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  title: string;
  subtitle?: string;
  data: LineDataPoint[];
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  color?: string;
}

export const LineChartComponent: React.FC<LineChartProps> = ({
  title,
  subtitle,
  data,
  valuePrefix = '',
  valueSuffix = '',
  height = 260,
  color = '#F97316',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-gray-500" style={{ height }}>
        <p className="text-sm">No trend data available</p>
      </div>
    );
  }

  const values = data.map(d => Number(d.value) || 0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, 1);
  const range = maxVal - minVal || 1;

  const chartHeight = height - 80;
  const chartWidth = 500;
  const paddingX = 45;
  const paddingY = 25;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * usableWidth;
    const y = paddingY + usableHeight - ((Number(d.value) - minVal) / range) * usableHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${paddingY + usableHeight} L ${points[0].x} ${paddingY + usableHeight} Z`
    : '';

  const formatVal = (v: number) => {
    const hasDec = v % 1 !== 0;
    return `${valuePrefix}${hasDec ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v.toLocaleString()}${valueSuffix}`;
  };

  const handleDownload = () => {
    if (svgRef.current) {
      downloadSvgAsPng(svgRef.current, title || 'Line_Trend_Chart', title);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-[#111111]">{title}</h4>
          {subtitle && <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={handleDownload}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50/50 transition-colors cursor-pointer"
          title="Download Chart as PNG"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative w-full" style={{ height: chartHeight }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const yPos = paddingY + usableHeight * (1 - ratio);
            const val = minVal + range * ratio;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={yPos}
                  x2={chartWidth - paddingX}
                  y2={yPos}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 6}
                  y={yPos + 3}
                  textAnchor="end"
                  className="text-[9px] fill-[#6B7280] font-mono"
                >
                  {formatVal(val)}
                </text>
              </g>
            );
          })}

          {/* Fill area */}
          <path d={areaD} fill={color} opacity="0.08" />

          {/* Main stroke line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? color : '#FFFFFF'}
                  stroke={color}
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />
                {/* X Axis Label */}
                <text
                  x={p.x}
                  y={paddingY + usableHeight + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-[#6B7280]"
                >
                  {p.label.length > 8 ? p.label.slice(0, 7) + '…' : p.label}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredIdx !== null && points[hoveredIdx] && (
          <div className="absolute top-2 right-2 bg-white/95 border border-orange-200 px-3 py-1.5 rounded-lg shadow-sm text-xs pointer-events-none z-10">
            <span className="font-medium text-[#111111]">{points[hoveredIdx].label}</span>
            <div className="font-bold text-orange-600">{formatVal(points[hoveredIdx].value)}</div>
          </div>
        )}
      </div>
    </div>
  );
};
