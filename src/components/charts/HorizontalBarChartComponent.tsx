import React, { useState, useRef } from 'react';
import { Download } from 'lucide-react';
import { downloadSvgAsPng } from '../../utils/chartExport';

interface HorizontalBarDataPoint {
  label: string;
  value: number;
  benchmark?: number;
}

interface HorizontalBarProps {
  title: string;
  subtitle?: string;
  data: HorizontalBarDataPoint[];
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  color?: string;
}

export const HorizontalBarChartComponent: React.FC<HorizontalBarProps> = ({
  title,
  subtitle,
  data,
  valuePrefix = '',
  valueSuffix = '',
  color = '#F97316',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-gray-500 min-h-[220px]">
        <p className="text-sm">No ranking data available</p>
      </div>
    );
  }

  const items = data.slice(0, 6);
  const maxValue = Math.max(...items.map(d => Number(d.value) || 0), 1);

  const formatExactVal = (v: number) => {
    const hasDec = v % 1 !== 0;
    return `${valuePrefix}${hasDec ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v.toLocaleString()}${valueSuffix}`;
  };

  const handleDownload = () => {
    // Generate inline SVG for clean download
    const svgWidth = 500;
    const svgHeight = items.length * 40 + 60;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(svgWidth));
    svg.setAttribute('height', String(svgHeight));
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    // Background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#FFFFFF');
    svg.appendChild(bg);

    // Title
    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', '20');
    titleText.setAttribute('y', '30');
    titleText.setAttribute('font-family', 'sans-serif');
    titleText.setAttribute('font-size', '14');
    titleText.setAttribute('font-weight', 'bold');
    titleText.setAttribute('fill', '#111111');
    titleText.textContent = title;
    svg.appendChild(titleText);

    items.forEach((item, idx) => {
      const y = 50 + idx * 36;
      const barW = Math.max(8, ((Number(item.value) || 0) / maxValue) * 280);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', '20');
      label.setAttribute('y', String(y + 12));
      label.setAttribute('font-family', 'sans-serif');
      label.setAttribute('font-size', '11');
      label.setAttribute('fill', '#111111');
      label.textContent = item.label;
      svg.appendChild(label);

      const barBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      barBg.setAttribute('x', '160');
      barBg.setAttribute('y', String(y));
      barBg.setAttribute('width', '280');
      barBg.setAttribute('height', '14');
      barBg.setAttribute('rx', '4');
      barBg.setAttribute('fill', '#F3F4F6');
      svg.appendChild(barBg);

      const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bar.setAttribute('x', '160');
      bar.setAttribute('y', String(y));
      bar.setAttribute('width', String(barW));
      bar.setAttribute('height', '14');
      bar.setAttribute('rx', '4');
      bar.setAttribute('fill', color);
      svg.appendChild(bar);

      const valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      valText.setAttribute('x', '450');
      valText.setAttribute('y', String(y + 11));
      valText.setAttribute('font-family', 'sans-serif');
      valText.setAttribute('font-size', '11');
      valText.setAttribute('font-weight', 'bold');
      valText.setAttribute('fill', '#111111');
      valText.textContent = formatExactVal(item.value);
      svg.appendChild(valText);
    });

    downloadSvgAsPng(svg, title || 'Horizontal_Bar_Chart', title);
  };

  return (
    <div ref={containerRef} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
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

      <div className="flex flex-col gap-2.5 py-1">
        {items.map((item, idx) => {
          const val = Number(item.value) || 0;
          const pct = Math.min(100, Math.max(3, (val / maxValue) * 100));
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex flex-col gap-1 cursor-pointer"
            >
              <div className="flex justify-between items-center text-xs">
                <span className={`font-medium truncate max-w-[240px] ${isHovered ? 'text-orange-600' : 'text-[#111111]'}`}>
                  {item.label}
                </span>
                <span className="font-mono text-[#111111] font-semibold">{formatExactVal(val)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                    opacity: isHovered ? 1 : 0.88,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
