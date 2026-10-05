import React, { useState, useRef } from 'react';
import { Download } from 'lucide-react';
import { downloadSvgAsPng } from '../../utils/chartExport';

interface BarDataPoint {
  label: string;
  value: number;
  subValue?: number;
  secondaryLabel?: string;
}

interface BarChartProps {
  title: string;
  subtitle?: string;
  data: BarDataPoint[];
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  color?: string;
}

export const BarChartComponent: React.FC<BarChartProps> = ({
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
        <p className="text-sm">No data available for this view</p>
      </div>
    );
  }

  const values = data.map(d => Number(d.value) || 0);
  const maxValue = Math.max(...values, 1);
  const chartHeight = height - 80;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;
  const barWidth = Math.min(48, Math.max(16, (usableWidth / data.length) * 0.55));
  const step = usableWidth / data.length;

  const formatVal = (v: number) => {
    // Preserve precision, do not round up
    const hasDec = v % 1 !== 0;
    return `${valuePrefix}${hasDec ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v.toLocaleString()}${valueSuffix}`;
  };

  const handleDownload = () => {
    if (svgRef.current) {
      downloadSvgAsPng(svgRef.current, title || 'Bar_Chart', title);
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
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const yPos = paddingY + usableHeight * (1 - ratio);
            const val = maxValue * ratio;
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

          {/* Baseline */}
          <line
            x1={paddingX}
            y1={paddingY + usableHeight}
            x2={chartWidth - paddingX}
            y2={paddingY + usableHeight}
            stroke="#E5E7EB"
            strokeWidth="1.5"
          />

          {/* Bars */}
          {data.map((d, idx) => {
            const val = Number(d.value) || 0;
            const barH = (val / maxValue) * usableHeight;
            const x = paddingX + idx * step + (step - barWidth) / 2;
            const y = paddingY + usableHeight - barH;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-all duration-150"
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, 2)}
                  rx="4"
                  fill={color}
                  opacity={isHovered ? 1 : 0.88}
                  className="transition-opacity duration-150"
                />
                {/* Bar top label if hovered */}
                {isHovered && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="text-[10px] font-semibold fill-[#111111]"
                  >
                    {formatVal(val)}
                  </text>
                )}
                {/* X Axis Label */}
                <text
                  x={x + barWidth / 2}
                  y={paddingY + usableHeight + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-[#6B7280] truncate"
                  style={{ maxWidth: step }}
                >
                  {d.label.length > 9 ? d.label.slice(0, 8) + '…' : d.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover detail tooltip */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-2 right-2 bg-white/95 border border-orange-200 px-3 py-1.5 rounded-lg shadow-sm text-xs pointer-events-none z-10">
            <span className="font-medium text-[#111111]">{data[hoveredIdx].label}</span>
            <div className="font-bold text-orange-600">{formatVal(data[hoveredIdx].value)}</div>
            {data[hoveredIdx].secondaryLabel && (
              <div className="text-[#6B7280] text-[10px]">{data[hoveredIdx].secondaryLabel}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
