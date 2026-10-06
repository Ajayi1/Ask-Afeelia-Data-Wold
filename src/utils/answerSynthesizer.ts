/**
 * Utility to parse SQL query results and generate exact calculations
 * and plain-language answers for the ASK AFEELIA DATA WORLD AI Agent.
 */

export interface CalculatedInsight {
  plainText: string;
  topEntity?: string;
  metricLabel?: string;
  formattedValue?: string;
  subtext?: string;
}

/**
 * Intelligently formats numbers as currency, percentage, or rounded counts
 */
export function formatSmartNumber(val: any, colName: string = ''): string {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (isNaN(num)) return String(val);

  const lowerCol = colName.toLowerCase();
  const isCurrency =
    lowerCol.includes('sale') ||
    lowerCol.includes('revenue') ||
    lowerCol.includes('amount') ||
    lowerCol.includes('price') ||
    lowerCol.includes('cost') ||
    lowerCol.includes('profit') ||
    lowerCol.includes('spend') ||
    lowerCol.includes('total_sales') ||
    lowerCol.includes('total_revenue');

  const isPercent =
    lowerCol.includes('rate') ||
    lowerCol.includes('percent') ||
    lowerCol.includes('pct') ||
    lowerCol.includes('margin') ||
    lowerCol.includes('ratio');

  if (isPercent) {
    return `${num.toFixed(1)}%`;
  }
  if (isCurrency) {
    return `$${num.toLocaleString(undefined, {
      minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2);
}

/**
 * Deterministically synthesizes an exact plain-language answer from executed query results
 */
export function synthesizeCalculatedAnswer(
  question: string,
  queryResults: any[],
  sql: string
): CalculatedInsight {
  if (!queryResults || queryResults.length === 0) {
    return {
      plainText: `No records were found in the dataset matching the query criteria.`,
      subtext: '0 records returned',
    };
  }

  const columns = Object.keys(queryResults[0]);
  if (columns.length === 0) {
    return { plainText: `The query executed successfully without returning data columns.` };
  }

  // Detect string/category columns vs numeric metric columns
  const numCols = columns.filter(col => {
    return queryResults.some(r => typeof r[col] === 'number');
  });
  const catCols = columns.filter(col => !numCols.includes(col));

  const primaryNum = numCols[0];
  const primaryCat = catCols[0];

  // Case 1: Single scalar aggregate (e.g. SELECT SUM(sales) AS total_sales)
  if (queryResults.length === 1 && numCols.length >= 1 && catCols.length === 0) {
    const val = queryResults[0][primaryNum];
    const metricName = primaryNum.replace(/_/g, ' ').replace(/^sum |^avg |^max |^min /i, '').trim();
    const formatted = formatSmartNumber(val, primaryNum);
    return {
      plainText: `Based on the active dataset calculation, the total **${metricName}** is **${formatted}**.`,
      metricLabel: metricName.toUpperCase(),
      formattedValue: formatted,
      subtext: `Calculated from dataset records`,
    };
  }

  // Case 2: Ranked list or Grouped breakdown (e.g. department vs sales)
  if (primaryCat && primaryNum) {
    const topRow = queryResults[0];
    const topEntity = String(topRow[primaryCat] || 'Unknown');
    const topVal = topRow[primaryNum];
    const formattedTopVal = formatSmartNumber(topVal, primaryNum);
    const metricName = primaryNum.replace(/_/g, ' ').replace(/^sum |^avg |^max |^min /i, '').trim();
    const catName = primaryCat.replace(/_/g, ' ').trim();

    let text = `The **${catName}** with the highest ${metricName} is **${topEntity}** with **${formattedTopVal}**.`;

    if (queryResults.length > 1) {
      const secondRow = queryResults[1];
      const secondEntity = String(secondRow[primaryCat] || 'Unknown');
      const secondVal = secondRow[primaryNum];
      const formattedSecondVal = formatSmartNumber(secondVal, primaryNum);

      text += ` It is followed by **${secondEntity}** at **${formattedSecondVal}**`;

      if (queryResults.length > 2) {
        const thirdRow = queryResults[2];
        const thirdEntity = String(thirdRow[primaryCat] || 'Unknown');
        const thirdVal = thirdRow[primaryNum];
        const formattedThirdVal = formatSmartNumber(thirdVal, primaryNum);
        text += `, and **${thirdEntity}** at **${formattedThirdVal}**.`;
      } else {
        text += '.';
      }

      // Compute variance/difference if numbers
      if (typeof topVal === 'number' && typeof secondVal === 'number' && secondVal > 0) {
        const diff = topVal - secondVal;
        const pctDiff = ((diff / secondVal) * 100).toFixed(1);
        text += ` **${topEntity}** outpaces **${secondEntity}** by ${formatSmartNumber(diff, primaryNum)} (+${pctDiff}%).`;
      }
    }

    return {
      plainText: text,
      topEntity,
      metricLabel: metricName.toUpperCase(),
      formattedValue: formattedTopVal,
      subtext: `Highest performing ${catName}`,
    };
  }

  // Case 3: Single record with multiple fields
  if (queryResults.length === 1) {
    const row = queryResults[0];
    const pairs = Object.entries(row)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: **${formatSmartNumber(v, k)}**`)
      .join(', ');
    return {
      plainText: `Here is the calculated result: ${pairs}.`,
      subtext: 'Calculated 1 record',
    };
  }

  // Default fallback for general tables
  const rowCount = queryResults.length;
  const firstCol = columns[0];
  const firstVal = queryResults[0][firstCol];
  return {
    plainText: `The analysis retrieved **${rowCount} records**. The leading record is **${String(firstVal)}**.`,
    subtext: `${rowCount} records calculated`,
  };
}
