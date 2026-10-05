import React, { useState, useRef } from 'react';
import { Download } from 'lucide-react';
import { downloadSvgAsPng } from '../../utils/chartExport';

interface DonutDataPoint {
  label: string;
  value: number;
}

interface DonutChartProps {
  title: string;
  subtitle?: string;
  data: DonutDataPoint[];
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  color?: string;
}

export const DonutChartComponent: React.FC<DonutChartProps> = ({
  title,
  subtitle,
  data,
  valuePrefix = '',
  valueSuffix = '',
  height = 260,
  color,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-gray-500" style={{ height }}>
        <p className="text-sm">No proportion data available</p>
      </div>
    );
  }

  const basePalette = color
    ? [color, '#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#C2410C']
    : ['#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#C2410C'];

  const validData = data.slice(0, 6);
  const total = validData.reduce((acc, d) => acc + (Number(d.value) || 0), 0);

  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const slices = validData.map((d, idx) => {
    const val = Number(d.value) || 0;
    const percent = total > 0 ? val / total : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;
    return {
      ...d,
      percent,
      strokeDasharray,
      strokeDashoffset,
      color: basePalette[idx % basePalette.length],
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  const handleDownload = () => {
    if (svgRef.current) {
      downloadSvgAsPng(svgRef.current, title || 'Donut_Chart', title);
    }
  };

  const formatExactVal = (v: number) => {
    const hasDec = v % 1 !== 0;
    return `${valuePrefix}${hasDec ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v.toLocaleString()}${valueSuffix}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-2">
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

      <div className="flex items-center justify-between gap-4 py-1">
        {/* SVG Donut */}
        <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
          <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {slices.map((slice, idx) => (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={hoveredIdx === idx ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>

          {/* Donut Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
            <span className="text-xs text-[#6B7280] font-medium truncate max-w-[100px]">
              {activeSlice ? activeSlice.label : 'Total'}
            </span>
            <span className="text-sm font-bold text-[#111111]">
              {activeSlice
                ? `${(activeSlice.percent * 100).toFixed(1)}%`
                : formatExactVal(total)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
          {slices.map((slice, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between text-xs py-1 px-1.5 rounded cursor-pointer transition-colors ${
                hoveredIdx === idx ? 'bg-orange-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-[#111111] font-medium">{slice.label}</span>
              </div>
              <span className="text-[#6B7280] font-mono text-[11px] ml-2 flex-shrink-0">
                {(slice.percent * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
