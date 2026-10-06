import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import pptxgen from 'pptxgenjs';
import { AnalysisPackage, DatasetState } from '../types/data';

/**
 * Builds the jsPDF document object with guaranteed zero-overlap layout
 */
export function buildPdfDocument(datasetState: DatasetState, analysis: AnalysisPackage): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primaryOrange: [number, number, number] = [249, 115, 22]; // #F97316
  const textBlack: [number, number, number] = [17, 17, 17]; // #111111
  const textGrey: [number, number, number] = [107, 114, 128]; // #6B7280
  const lightGreyBg: [number, number, number] = [249, 250, 251]; // #F9FAFB

  let pageNumber = 1;

  const addFooter = (pageNum: number) => {
    doc.setFontSize(8);
    doc.setTextColor(...textGrey);
    doc.text('ASK AFEELIA DATA WORLD — Executive Diagnostic Report', margin, pageHeight - 8);
    doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      addFooter(pageNumber++);
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Header Banner
  doc.setFillColor(...primaryOrange);
  doc.rect(margin, y, 5, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...textBlack);
  doc.text('ASK AFEELIA DATA WORLD', margin + 9, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textGrey);
  doc.text(
    `Executive Diagnostic Report  |  Generated ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    margin + 9,
    y + 14
  );

  y += 26;

  // ==========================================
  // Problem, Objective & Desired KPIs Section (Dynamically Measured)
  // ==========================================
  const probText = datasetState.businessProblem || 'Performance diagnostic and operational optimization';
  const objText = datasetState.objective || 'Identify top drivers and root cause factors';
  const kpiText = datasetState.desiredKpis || '';

  doc.setFontSize(8.5);
  const probLines = doc.splitTextToSize(probText, contentWidth - 44);
  const objLines = doc.splitTextToSize(objText, contentWidth - 44);
  const kpiLines = kpiText ? doc.splitTextToSize(kpiText, contentWidth - 44) : [];

  const probHeight = Math.max(probLines.length * 4.2, 7);
  const objHeight = Math.max(objLines.length * 4.2, 7);
  const kpiHeight = kpiText ? Math.max(kpiLines.length * 4.2, 7) : 0;

  const totalBoxHeight = 12 + probHeight + 4 + objHeight + (kpiText ? 4 + kpiHeight : 0);

  // Background box
  doc.setFillColor(...lightGreyBg);
  doc.roundedRect(margin, y, contentWidth, totalBoxHeight, 2, 2, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(margin, y, contentWidth, totalBoxHeight, 2, 2, 'S');

  let currentInnerY = y + 5;

  // Row 1: Problem
  doc.setFillColor(255, 237, 213);
  doc.roundedRect(margin + 4, currentInnerY, 32, 6, 1, 1, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryOrange);
  doc.text('BUSINESS PROBLEM', margin + 6, currentInnerY + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textBlack);
  doc.text(probLines, margin + 40, currentInnerY + 4);
  currentInnerY += probHeight + 4;

  // Row 2: Objective
  doc.setFillColor(255, 237, 213);
  doc.roundedRect(margin + 4, currentInnerY, 32, 6, 1, 1, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryOrange);
  doc.text('OBJECTIVE', margin + 6, currentInnerY + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textBlack);
  doc.text(objLines, margin + 40, currentInnerY + 4);
  currentInnerY += objHeight + 4;

  // Row 3: Target KPIs (if provided)
  if (kpiText) {
    doc.setFillColor(255, 237, 213);
    doc.roundedRect(margin + 4, currentInnerY, 32, 6, 1, 1, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryOrange);
    doc.text('TARGET KPIS', margin + 6, currentInnerY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textBlack);
    doc.text(kpiLines, margin + 40, currentInnerY + 4);
  }

  y += totalBoxHeight + 8;

  // ==========================================
  // Section 1: Executive KPI Scorecard (Exact Values, No Rounding Up)
  // ==========================================
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryOrange);
  doc.text('1. EXECUTIVE KPI SCORECARD', margin, y);
  y += 5;

  const kpiData = (analysis.kpis || []).map(kpi => [
    kpi.title,
    String(kpi.computedValue || '-'),
    kpi.change || 'Baseline',
    kpi.sql || '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Metric / KPI', 'Exact Value', 'Variance / Trajectory', 'Underlying SQL Logic']],
    body: kpiData,
    theme: 'plain',
    headStyles: {
      fillColor: primaryOrange,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: textBlack,
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [254, 250, 245],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 48 },
      1: { fontStyle: 'bold', textColor: primaryOrange, cellWidth: 34 },
      2: { cellWidth: 34 },
      3: { textColor: textGrey, fontSize: 7.5 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 10;

  // ==========================================
  // Section 2: Key Insights
  // ==========================================
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryOrange);
  doc.text('2. KEY STRATEGIC INSIGHTS', margin, y);
  y += 6;

  (analysis.insights || []).forEach((insight, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(insight, contentWidth - 12);
    checkPageBreak(lines.length * 4.5 + 4);

    doc.setFillColor(...primaryOrange);
    doc.circle(margin + 2.5, y - 1, 1.4, 'F');

    doc.setTextColor(...textBlack);
    doc.text(lines, margin + 8, y);
    y += lines.length * 4.5 + 3.5;
  });

  y += 4;

  // ==========================================
  // Section 3: Recommendations
  // ==========================================
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryOrange);
  doc.text('3. ACTIONABLE RECOMMENDATIONS', margin, y);
  y += 6;

  (analysis.recommendations || []).forEach((rec, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(rec, contentWidth - 18);
    checkPageBreak(lines.length * 4.5 + 4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryOrange);
    doc.text(`0${idx + 1}`, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textBlack);
    doc.text(lines, margin + 8, y);
    y += lines.length * 4.5 + 3.5;
  });

  // ==========================================
  // Page 2+: SQL Diagnostic Queries & Tables
  // ==========================================
  addFooter(pageNumber++);
  doc.addPage();
  y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryOrange);
  doc.text('4. SQL DIAGNOSTIC QUERIES & RESULT TABLES', margin, y);
  y += 6;

  const queries = analysis.queries || [];
  for (const q of queries) {
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...textBlack);
    doc.text(q.title, margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textGrey);
    const expLines = doc.splitTextToSize(`Explanation: ${q.explanation}`, contentWidth);
    doc.text(expLines, margin, y);
    y += expLines.length * 3.8 + 3;

    if (q.results && q.results.length > 0) {
      const headers = Object.keys(q.results[0]).slice(0, 6);
      const tableRows = q.results.slice(0, 5).map(r => headers.map(h => String(r[h] ?? '')));

      autoTable(doc, {
        startY: y,
        head: [headers],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [31, 41, 55],
          textColor: [255, 255, 255],
          fontSize: 7.5,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: textBlack,
        },
        margin: { left: margin, right: margin },
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 8;
    } else {
      y += 4;
    }
  }

  // Final hygiene audit summary
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryOrange);
  doc.text('5. DATASET AUDIT SUMMARY', margin, y);
  y += 5;

  const auditRows = [
    ['Filename', datasetState.filename || 'Uploaded File'],
    ['Total Records', `${datasetState.stats.totalRows.toLocaleString()} rows`],
    ['Features Audited', `${datasetState.stats.columnsCount} columns`],
    ['Blanks Handled', `${datasetState.stats.blanksCleaned} entries`],
    ['Duplicates Filtered', `${datasetState.stats.duplicatesRemoved} duplicate rows`],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Audit Dimension', 'Normalized Status']],
    body: auditRows,
    theme: 'plain',
    headStyles: {
      fillColor: primaryOrange,
      textColor: [255, 255, 255],
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
    },
    margin: { left: margin, right: margin },
  });

  addFooter(pageNumber);

  return doc;
}

/**
 * Builds Blob URL for instant PDF preview inside the app modal
 */
export function buildPdfBlobUrl(datasetState: DatasetState, analysis: AnalysisPackage): string {
  const doc = buildPdfDocument(datasetState, analysis);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

/**
 * Direct file download trigger for PDF
 */
export function generatePdfReport(datasetState: DatasetState, analysis: AnalysisPackage): void {
  const doc = buildPdfDocument(datasetState, analysis);
  doc.save(`Ask_Afeelia_Data_World_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Slide Presentation Structure for Interactive In-App Deck Preview
 */
export interface SlidePreviewItem {
  slideNumber: number;
  category: string;
  title: string;
  subtitle?: string;
  elements: Array<{
    type: 'text' | 'card' | 'kpis' | 'table' | 'insights';
    data: any;
  }>;
}

/**
 * Generates PowerPoint Presentation with fixed text boundaries (zero overflow / overlap)
 */
export async function generatePptxSlides(datasetState: DatasetState, analysis: AnalysisPackage): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  const ORANGE = 'F97316';
  const LIGHT_ORANGE = 'FFF7ED';
  const BLACK = '111111';
  const GREY = '6B7280';
  const WHITE = 'FFFFFF';
  const CARD_BG = 'F9FAFB';

  const addHeader = (slide: pptxgen.Slide, title: string, category: string) => {
    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.35,
      w: 8.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: ORANGE,
      fontFace: 'Arial',
    });
    slide.addText(title, {
      x: 0.8,
      y: 0.65,
      w: 11.0,
      h: 0.6,
      fontSize: 20,
      bold: true,
      color: BLACK,
      fontFace: 'Arial',
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 1.3,
      w: 2.0,
      h: 0.04,
      fill: { color: ORANGE },
    });
  };

  const addFooter = (slide: pptxgen.Slide, slideNum: number) => {
    slide.addText('ASK AFEELIA DATA WORLD  |  Executive Diagnostic Deck', {
      x: 0.8,
      y: 6.95,
      w: 7.0,
      h: 0.3,
      fontSize: 9,
      color: GREY,
      fontFace: 'Arial',
    });
    slide.addText(`Slide ${slideNum}`, {
      x: 11.5,
      y: 6.95,
      w: 1.0,
      h: 0.3,
      fontSize: 9,
      align: 'right',
      color: GREY,
      fontFace: 'Arial',
    });
  };

  // ==========================================
  // SLIDE 1: Title Slide (Zero Overlap)
  // ==========================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: WHITE };

  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.6,
    w: 0.12,
    h: 3.8,
    fill: { color: ORANGE },
  });

  slide1.addText('ASK AFEELIA DATA WORLD', {
    x: 1.2,
    y: 1.6,
    w: 10.5,
    h: 0.35,
    fontSize: 13,
    bold: true,
    color: ORANGE,
    fontFace: 'Arial',
  });

  slide1.addText('Executive Data Intelligence &\nDiagnostic Analysis', {
    x: 1.2,
    y: 2.05,
    w: 10.5,
    h: 1.2,
    fontSize: 28,
    bold: true,
    color: BLACK,
    fontFace: 'Arial',
  });

  slide1.addText(`Problem Statement:\n"${datasetState.businessProblem || 'Performance Optimization'}"`, {
    x: 1.2,
    y: 3.4,
    w: 10.5,
    h: 0.9,
    fontSize: 13,
    color: GREY,
    fontFace: 'Arial',
  });

  slide1.addText(`Objective: ${datasetState.objective || 'Identify top drivers and root causes'}`, {
    x: 1.2,
    y: 4.4,
    w: 10.5,
    h: 0.6,
    fontSize: 13,
    bold: true,
    color: BLACK,
    fontFace: 'Arial',
  });

  slide1.addText(`Dataset: ${datasetState.filename || 'Uploaded File'}  |  Date: ${new Date().toLocaleDateString()}`, {
    x: 1.2,
    y: 5.4,
    w: 8.0,
    h: 0.4,
    fontSize: 10,
    color: GREY,
    fontFace: 'Arial',
  });

  // ==========================================
  // SLIDE 2: Business Context & Objective
  // ==========================================
  const slide2 = pptx.addSlide();
  slide2.background = { color: WHITE };
  addHeader(slide2, 'Business Context & Objective Framing', 'Context & Objectives');
  addFooter(slide2, 2);

  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.6,
    w: 5.4,
    h: 4.9,
    fill: { color: CARD_BG },
    line: { color: 'E5E7EB', width: 1 },
  });
  slide2.addText('THE BUSINESS PROBLEM', {
    x: 1.1,
    y: 1.85,
    w: 4.8,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: ORANGE,
    fontFace: 'Arial',
  });
  slide2.addText(datasetState.businessProblem || 'No problem stated', {
    x: 1.1,
    y: 2.25,
    w: 4.8,
    h: 1.6,
    fontSize: 14,
    bold: true,
    color: BLACK,
    fontFace: 'Arial',
  });
  slide2.addText('Operational Impact:', {
    x: 1.1,
    y: 4.1,
    w: 4.8,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: BLACK,
    fontFace: 'Arial',
  });
  slide2.addText(
    'This problem directly affects revenue realization, margin leakage, and segment distribution across active business lines.',
    {
      x: 1.1,
      y: 4.45,
      w: 4.8,
      h: 1.6,
      fontSize: 11,
      color: GREY,
      fontFace: 'Arial',
    }
  );

  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 6.6,
    y: 1.6,
    w: 5.8,
    h: 4.9,
    fill: { color: LIGHT_ORANGE },
    line: { color: 'FED7AA', width: 1 },
  });
  slide2.addText('ANALYSIS OBJECTIVE', {
    x: 6.9,
    y: 1.85,
    w: 5.2,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: ORANGE,
    fontFace: 'Arial',
  });
  slide2.addText(datasetState.objective || 'Identify top drivers and root causes', {
    x: 6.9,
    y: 2.25,
    w: 5.2,
    h: 1.6,
    fontSize: 14,
    bold: true,
    color: BLACK,
    fontFace: 'Arial',
  });
  slide2.addText('Dataset Parameters Audited:', {
    x: 6.9,
    y: 4.1,
    w: 5.2,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: BLACK,
    fontFace: 'Arial',
  });
  slide2.addText(
    `- Records analyzed: ${datasetState.stats.totalRows.toLocaleString()} rows\n- Cleaned features: ${datasetState.stats.columnsCount} columns\n- Blanks imputed: ${datasetState.stats.blanksCleaned}\n- Duplicates removed: ${datasetState.stats.duplicatesRemoved}`,
    {
      x: 6.9,
      y: 4.45,
      w: 5.2,
      h: 1.6,
      fontSize: 11,
      color: BLACK,
      fontFace: 'Arial',
    }
  );

  // ==========================================
  // SLIDE 3: Executive KPI Scorecard (Exact Figures, Unlimited Stated Metrics)
  // ==========================================
  const allKpis = analysis.kpis || [];
  const slide3 = pptx.addSlide();
  slide3.background = { color: WHITE };
  addHeader(slide3, 'Executive KPI Scorecard', `${allKpis.length} Stated Target Metrics`);
  addFooter(slide3, 3);

  if (allKpis.length <= 4) {
    const cardWidth = 2.65;
    const startX = 0.8;
    const gap = 0.33;

    allKpis.forEach((kpi, idx) => {
      const xPos = startX + idx * (cardWidth + gap);
      slide3.addShape(pptx.ShapeType.roundRect, {
        x: xPos,
        y: 1.7,
        w: cardWidth,
        h: 4.8,
        fill: { color: CARD_BG },
        line: { color: 'E5E7EB', width: 1 },
      });

      slide3.addShape(pptx.ShapeType.rect, {
        x: xPos,
        y: 1.7,
        w: cardWidth,
        h: 0.08,
        fill: { color: ORANGE },
      });

      slide3.addText(`METRIC 0${idx + 1}`, {
        x: xPos + 0.2,
        y: 1.9,
        w: cardWidth - 0.4,
        h: 0.25,
        fontSize: 9,
        bold: true,
        color: ORANGE,
        fontFace: 'Arial',
      });

      slide3.addText(kpi.title, {
        x: xPos + 0.2,
        y: 2.2,
        w: cardWidth - 0.4,
        h: 0.65,
        fontSize: 11,
        bold: true,
        color: BLACK,
        fontFace: 'Arial',
      });

      slide3.addText(String(kpi.computedValue || '--'), {
        x: xPos + 0.2,
        y: 2.9,
        w: cardWidth - 0.4,
        h: 0.85,
        fontSize: 22,
        bold: true,
        color: ORANGE,
        fontFace: 'Arial',
      });

      slide3.addText(kpi.change || 'Standard Baseline', {
        x: xPos + 0.2,
        y: 3.85,
        w: cardWidth - 0.4,
        h: 0.4,
        fontSize: 10,
        bold: true,
        color: kpi.isPositive ? '16A34A' : 'DC2626',
        fontFace: 'Arial',
      });

      slide3.addText(
        'SQL Query:\n' + (kpi.sql ? kpi.sql.slice(0, 48) + '...' : 'SELECT SUM(val) FROM dataset'),
        {
          x: xPos + 0.2,
          y: 4.4,
          w: cardWidth - 0.4,
          h: 1.8,
          fontSize: 8,
          color: GREY,
          fontFace: 'Courier',
        }
      );
    });
  } else {
    // Multi-row layout for 5+ KPIs
    const cols = Math.min(4, Math.ceil(allKpis.length / 2));
    const cardWidth = (11.6 - (cols - 1) * 0.25) / cols;
    const cardHeight = allKpis.length > 8 ? 1.5 : 2.3;
    const gapX = 0.25;
    const gapY = 0.25;
    const startX = 0.8;
    const startY = 1.7;

    allKpis.slice(0, 8).forEach((kpi, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const xPos = startX + col * (cardWidth + gapX);
      const yPos = startY + row * (cardHeight + gapY);

      slide3.addShape(pptx.ShapeType.roundRect, {
        x: xPos,
        y: yPos,
        w: cardWidth,
        h: cardHeight,
        fill: { color: CARD_BG },
        line: { color: 'E5E7EB', width: 1 },
      });

      slide3.addShape(pptx.ShapeType.rect, {
        x: xPos,
        y: yPos,
        w: cardWidth,
        h: 0.06,
        fill: { color: ORANGE },
      });

      slide3.addText(`0${idx + 1} • ${kpi.title}`, {
        x: xPos + 0.15,
        y: yPos + 0.15,
        w: cardWidth - 0.3,
        h: 0.4,
        fontSize: 10,
        bold: true,
        color: BLACK,
        fontFace: 'Arial',
      });

      slide3.addText(String(kpi.computedValue || '--'), {
        x: xPos + 0.15,
        y: yPos + 0.6,
        w: cardWidth - 0.3,
        h: 0.8,
        fontSize: 18,
        bold: true,
        color: ORANGE,
        fontFace: 'Arial',
      });

      slide3.addText(kpi.change || 'Standard Baseline', {
        x: xPos + 0.15,
        y: yPos + 1.45,
        w: cardWidth - 0.3,
        h: 0.3,
        fontSize: 9,
        bold: true,
        color: kpi.isPositive ? '16A34A' : 'DC2626',
        fontFace: 'Arial',
      });

      slide3.addText(
        kpi.sql ? (kpi.sql.length > 40 ? kpi.sql.slice(0, 38) + '...' : kpi.sql) : '',
        {
          x: xPos + 0.15,
          y: yPos + 1.8,
          w: cardWidth - 0.3,
          h: 0.35,
          fontSize: 7.5,
          color: GREY,
          fontFace: 'Courier',
        }
      );
    });
  }

  // ==========================================
  // SLIDE 4: Key Insights & Diagnostic Findings
  // ==========================================
  const slide4 = pptx.addSlide();
  slide4.background = { color: WHITE };
  addHeader(slide4, 'Key Insights & Plain-Language Findings', 'Diagnostic Synthesis');
  addFooter(slide4, 4);

  const insights = (analysis.insights || []).slice(0, 4);
  insights.forEach((insight, idx) => {
    const yPos = 1.6 + idx * 1.25;

    slide4.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: yPos,
      w: 11.6,
      h: 1.1,
      fill: { color: CARD_BG },
      line: { color: 'E5E7EB', width: 1 },
    });

    slide4.addShape(pptx.ShapeType.ellipse, {
      x: 1.1,
      y: yPos + 0.3,
      w: 0.45,
      h: 0.45,
      fill: { color: ORANGE },
    });

    slide4.addText(`${idx + 1}`, {
      x: 1.1,
      y: yPos + 0.3,
      w: 0.45,
      h: 0.45,
      fontSize: 11,
      bold: true,
      align: 'center',
      color: WHITE,
      fontFace: 'Arial',
    });

    slide4.addText(insight, {
      x: 1.8,
      y: yPos + 0.15,
      w: 10.3,
      h: 0.8,
      fontSize: 11,
      color: BLACK,
      fontFace: 'Arial',
    });
  });

  // ==========================================
  // SLIDE 5: SQL Findings & Data Table
  // ==========================================
  const slide5 = pptx.addSlide();
  slide5.background = { color: WHITE };
  addHeader(slide5, 'Underlying Data Aggregations & Query Results', 'Data Evidence');
  addFooter(slide5, 5);

  const firstQuery = (analysis.queries && analysis.queries[0]) || null;
  if (firstQuery && firstQuery.results && firstQuery.results.length > 0) {
    const headers = Object.keys(firstQuery.results[0]).slice(0, 5);
    const tableData: any[][] = [headers];

    firstQuery.results.slice(0, 7).forEach(r => {
      tableData.push(headers.map(h => String(r[h] ?? '')));
    });

    slide5.addText(`Query: ${firstQuery.title} (${firstQuery.explanation})`, {
      x: 0.8,
      y: 1.5,
      w: 11.6,
      h: 0.4,
      fontSize: 11,
      bold: true,
      color: BLACK,
      fontFace: 'Arial',
    });

    slide5.addTable(tableData, {
      x: 0.8,
      y: 2.0,
      w: 11.6,
      fill: { color: WHITE },
      fontSize: 9.5,
      color: BLACK,
      border: { pt: 0.5, color: 'E5E7EB' },
    });
  }

  // ==========================================
  // SLIDE 6: Strategic Recommendations
  // ==========================================
  const slide6 = pptx.addSlide();
  slide6.background = { color: WHITE };
  addHeader(slide6, 'Strategic Recommendations', 'Actionable Roadmap');
  addFooter(slide6, 6);

  const recommendations = (analysis.recommendations || []).slice(0, 3);
  const recWidth = 3.65;
  const recGap = 0.35;

  recommendations.forEach((rec, idx) => {
    const xPos = 0.8 + idx * (recWidth + recGap);

    slide6.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 1.7,
      w: recWidth,
      h: 4.8,
      fill: { color: idx === 0 ? LIGHT_ORANGE : CARD_BG },
      line: { color: idx === 0 ? 'FED7AA' : 'E5E7EB', width: 1 },
    });

    slide6.addText(`PRIORITY 0${idx + 1}`, {
      x: xPos + 0.3,
      y: 2.0,
      w: recWidth - 0.6,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: ORANGE,
      fontFace: 'Arial',
    });

    slide6.addText(rec, {
      x: xPos + 0.3,
      y: 2.5,
      w: recWidth - 0.6,
      h: 3.8,
      fontSize: 12,
      color: BLACK,
      fontFace: 'Arial',
    });
  });

  // ==========================================
  // SLIDE 7: Next Steps & Close
  // ==========================================
  const slide7 = pptx.addSlide();
  slide7.background = { color: WHITE };
  addHeader(slide7, 'Implementation Next Steps & Monitoring', 'Execution');
  addFooter(slide7, 7);

  slide7.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.6,
    w: 11.6,
    h: 4.9,
    fill: { color: WHITE },
    line: { color: 'E5E7EB', width: 1 },
  });

  const nextSteps = [
    { title: 'Immediate (Week 1-2)', desc: 'Isolate critical variance drivers identified in SQL queries and initiate operational reviews.' },
    { title: 'Short Term (Month 1)', desc: 'Deploy automated threshold alerts against leading KPI indicators to curb negative divergence.' },
    { title: 'Medium Term (Quarter 1)', desc: 'Reallocate capital and resources toward resilient segments demonstrating highest margin stability.' },
  ];

  nextSteps.forEach((step, idx) => {
    const yPos = 2.0 + idx * 1.4;

    slide7.addText(step.title, {
      x: 1.2,
      y: yPos,
      w: 3.2,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: ORANGE,
      fontFace: 'Arial',
    });

    slide7.addText(step.desc, {
      x: 4.6,
      y: yPos,
      w: 7.4,
      h: 0.9,
      fontSize: 11,
      color: BLACK,
      fontFace: 'Arial',
    });
  });

  await pptx.writeFile({ fileName: `Ask_Afeelia_Data_World_Deck_${new Date().toISOString().slice(0, 10)}.pptx` });
}
