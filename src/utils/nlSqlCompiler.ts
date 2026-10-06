/**
 * Robust Deterministic Natural Language to SQL Compiler
 * Analyzes schema, active data samples, and user questions to produce
 * high-accuracy ANSI SQL queries even if external AI APIs are offline or busy.
 */

export interface CompiledQuery {
  sql: string;
  explanation: string;
  suggestedChart: 'bar' | 'line' | 'donut' | 'table';
  canAnswer: boolean;
  intent: 'ranking_high' | 'ranking_low' | 'average' | 'total' | 'count' | 'breakdown' | 'records';
  matchedEntityCol?: string;
  matchedMetricCol?: string;
  filtersApplied: string[];
}

export function compileNlToSql(
  question: string,
  schema: Array<{ name: string; type: string }>,
  sampleRows: Record<string, any>[] = []
): CompiledQuery {
  const qLower = question.toLowerCase().trim();

  const numCols = schema.filter(c => c.type === 'number').map(c => c.name);
  const catCols = schema.filter(c => c.type === 'string').map(c => c.name);

  // Fallback defaults
  const defaultNum = numCols[0] || 'id';
  const defaultCat = catCols[0] || 'category';

  // 1. Identify Explicit "Which <Entity>" / "By <Entity>" Target
  const whichMatch = qLower.match(/\b(?:which|what|top|best|lowest)\s+([a-z_]+)\b/i);
  const targetEntityTerm = whichMatch ? whichMatch[1].toLowerCase() : '';

  // 2. Identify Target Metric Column
  let matchedMetricCol = numCols.find(col => {
    const cLower = col.toLowerCase();
    return qLower.includes(cLower) || qLower.includes(cLower.replace(/_/g, ' '));
  });

  if (!matchedMetricCol) {
    // Synonym matching
    const metricSynonyms: Record<string, string[]> = {
      revenue: ['sale', 'sales', 'revenue', 'turnover', 'gross'],
      units_sold: ['unit', 'units', 'volume', 'quantity', 'items sold', 'units sold'],
      target: ['target', 'goal', 'quota', 'budget'],
      return_rate: ['return', 'returns', 'return rate', 'refund', 'refunds'],
      customer_churn: ['churn', 'churned', 'attrition', 'lost customers'],
      discount_pct: ['discount', 'discount %', 'markdown'],
      ad_spend: ['spend', 'ad spend', 'cost', 'marketing spend', 'budget'],
      conversions: ['conversion', 'conversions', 'leads', 'acquisitions'],
      cpa: ['cpa', 'cost per acquisition', 'cost per lead'],
      roas: ['roas', 'roi', 'return on ad spend', 'return on investment'],
      bounce_rate: ['bounce', 'bounce rate'],
      monthly_charges: ['charge', 'charges', 'bill', 'fee', 'monthly charge', 'price'],
      support_tickets: ['ticket', 'tickets', 'complaint', 'complaints', 'support'],
      satisfaction_score: ['satisfaction', 'csat', 'nps', 'rating', 'score'],
      tenure_months: ['tenure', 'months', 'duration', 'longevity']
    };

    for (const [colCandidate, syns] of Object.entries(metricSynonyms)) {
      const actualCol = numCols.find(c => c.toLowerCase() === colCandidate || c.toLowerCase().includes(colCandidate));
      if (actualCol && syns.some(s => qLower.includes(s))) {
        matchedMetricCol = actualCol;
        break;
      }
    }
  }

  // If still not matched, check if any numCol partial matches
  if (!matchedMetricCol && numCols.length > 0) {
    matchedMetricCol = numCols[0];
  }

  // 3. Detect Filter Conditions (WHERE clause) FIRST, so we don't group by a single filtered value
  const filters: string[] = [];
  const filteredCols = new Set<string>();

  // Quarter filters
  const quarterCol = catCols.find(c => c.toLowerCase().includes('quarter') || c.toLowerCase().includes('period'));
  if (quarterCol) {
    if (qLower.includes('first quarter') || qLower.includes('1st quarter') || qLower.includes('q1') || qLower.includes('quarter 1')) {
      filters.push(`${quarterCol} = 'Q1'`);
      filteredCols.add(quarterCol);
    } else if (qLower.includes('second quarter') || qLower.includes('2nd quarter') || qLower.includes('q2') || qLower.includes('quarter 2')) {
      filters.push(`${quarterCol} = 'Q2'`);
      filteredCols.add(quarterCol);
    } else if (qLower.includes('third quarter') || qLower.includes('3rd quarter') || qLower.includes('q3') || qLower.includes('quarter 3')) {
      filters.push(`${quarterCol} = 'Q3'`);
      filteredCols.add(quarterCol);
    } else if (qLower.includes('fourth quarter') || qLower.includes('4th quarter') || qLower.includes('q4') || qLower.includes('quarter 4')) {
      filters.push(`${quarterCol} = 'Q4'`);
      filteredCols.add(quarterCol);
    }
  }

  // Region filters
  const regionCol = catCols.find(c => c.toLowerCase().includes('region') || c.toLowerCase().includes('location'));
  if (regionCol) {
    if (/\bnorth\b/i.test(qLower) && targetEntityTerm !== 'region') {
      filters.push(`${regionCol} = 'North'`);
      filteredCols.add(regionCol);
    } else if (/\bsouth\b/i.test(qLower) && targetEntityTerm !== 'region') {
      filters.push(`${regionCol} = 'South'`);
      filteredCols.add(regionCol);
    } else if (/\beast\b/i.test(qLower) && targetEntityTerm !== 'region') {
      filters.push(`${regionCol} = 'East'`);
      filteredCols.add(regionCol);
    } else if (/\bwest\b/i.test(qLower) && targetEntityTerm !== 'region') {
      filters.push(`${regionCol} = 'West'`);
      filteredCols.add(regionCol);
    }
  }

  // Category / Segment filters in sample rows
  for (const catCol of catCols) {
    if (filteredCols.has(catCol)) continue;
    // Check unique sample values
    const distinctVals = Array.from(new Set(sampleRows.map(r => r[catCol]).filter(Boolean)));
    for (const val of distinctVals) {
      const valStr = String(val).toLowerCase();
      const regex = new RegExp(`\\b${valStr}\\b`, 'i');
      if (regex.test(qLower) && !filters.some(f => f.includes(String(val)))) {
        filters.push(`${catCol} = '${String(val).replace(/'/g, "''")}'`);
        filteredCols.add(catCol);
        break;
      }
    }
  }

  // 4. Identify Target Entity / Category Column (excluding already filtered single-value columns)
  let matchedEntityCol: string | undefined;

  // First check if targetEntityTerm directly maps to a column
  if (targetEntityTerm) {
    if (['department', 'dept', 'category'].includes(targetEntityTerm)) {
      matchedEntityCol = catCols.find(c => ['category', 'department', 'segment'].includes(c.toLowerCase()));
    } else if (['region', 'location', 'area'].includes(targetEntityTerm)) {
      matchedEntityCol = regionCol;
    } else if (['channel', 'source'].includes(targetEntityTerm)) {
      matchedEntityCol = catCols.find(c => c.toLowerCase().includes('channel'));
    } else if (['campaign'].includes(targetEntityTerm)) {
      matchedEntityCol = catCols.find(c => c.toLowerCase().includes('campaign'));
    } else if (['segment', 'tier'].includes(targetEntityTerm)) {
      matchedEntityCol = catCols.find(c => c.toLowerCase().includes('segment'));
    } else if (['contract', 'plan'].includes(targetEntityTerm)) {
      matchedEntityCol = catCols.find(c => c.toLowerCase().includes('contract'));
    } else if (['customer', 'client'].includes(targetEntityTerm)) {
      matchedEntityCol = catCols.find(c => c.toLowerCase().includes('customer'));
    }
  }

  // If not found yet, search available categorical columns (prioritizing non-filtered ones)
  if (!matchedEntityCol) {
    const candidateCatCols = catCols.filter(c => !filteredCols.has(c));
    matchedEntityCol = candidateCatCols.find(col => {
      const cLower = col.toLowerCase();
      return qLower.includes(cLower) || qLower.includes(cLower.replace(/_/g, ' '));
    });

    if (!matchedEntityCol) {
      const entitySynonyms: Record<string, string[]> = {
        department: ['department', 'dept', 'division', 'category', 'unit', 'team'],
        category: ['category', 'product category', 'type', 'line', 'class', 'department', 'dept'],
        region: ['region', 'territory', 'location', 'area', 'zone', 'geography', 'state', 'country'],
        channel: ['channel', 'source', 'medium', 'network', 'platform'],
        campaign: ['campaign', 'ad', 'initiative'],
        segment: ['segment', 'tier', 'customer tier', 'cohort', 'audience', 'customer segment'],
        contract: ['contract', 'plan', 'subscription', 'term'],
        customer_id: ['customer', 'account', 'client', 'subscriber', 'user'],
        quarter: ['quarter', 'period', 'term']
      };

      for (const [colCandidate, syns] of Object.entries(entitySynonyms)) {
        const actualCol = candidateCatCols.find(c => c.toLowerCase() === colCandidate || c.toLowerCase().includes(colCandidate));
        if (actualCol && syns.some(s => qLower.includes(s))) {
          matchedEntityCol = actualCol;
          break;
        }
      }
    }

    if (!matchedEntityCol && candidateCatCols.length > 0) {
      matchedEntityCol = candidateCatCols[0];
    }
  }

  const whereClause = filters.length > 0 ? ` WHERE ${filters.join(' AND ')}` : '';

  // 4. Determine Query Intent & Aggregation Type
  const isHighRanking = /\b(highest|top|most|maximum|max|greatest|best|peak|leading|largest)\b/i.test(qLower);
  const isLowRanking = /\b(lowest|bottom|least|minimum|min|worst|smallest|fewest)\b/i.test(qLower);
  const isAverage = /\b(average|avg|mean)\b/i.test(qLower);
  const isCount = /\b(how many|count|number of|records)\b/i.test(qLower) && !/\b(highest|lowest|sum|total)\b/i.test(qLower);
  const isTotal = /\b(total|sum|overall|aggregate|cumulative)\b/i.test(qLower);

  // Check if limit is explicitly asked (e.g. "top 3", "top 5", "top 10")
  const limitMatch = qLower.match(/top\s+(\d+)/i) || qLower.match(/first\s+(\d+)/i);
  const explicitLimit = limitMatch ? parseInt(limitMatch[1], 10) : null;

  // Decide Metric Aggregation Function
  const metricCol = matchedMetricCol || defaultNum;
  const isRateOrPct = metricCol.toLowerCase().includes('rate') ||
                      metricCol.toLowerCase().includes('pct') ||
                      metricCol.toLowerCase().includes('percent') ||
                      metricCol.toLowerCase().includes('score') ||
                      metricCol.toLowerCase().includes('cpa') ||
                      metricCol.toLowerCase().includes('roas');

  const defaultAggFunc = isAverage || isRateOrPct ? 'AVG' : 'SUM';

  // Construct queries based on intent:

  // Case A: Count query (e.g. "how many records are in Q1?", "how many customers churned?")
  if (isCount && !isHighRanking && !isLowRanking) {
    let sql: string;
    let explanation: string;
    if (matchedEntityCol && (qLower.includes('by') || qLower.includes('per'))) {
      sql = `SELECT ${matchedEntityCol}, COUNT(*) AS record_count FROM dataset${whereClause} GROUP BY ${matchedEntityCol} ORDER BY record_count DESC LIMIT 10`;
      explanation = `Calculates record count grouped by ${matchedEntityCol.replace(/_/g, ' ')}${whereClause ? ` with filters applied` : ''}.`;
    } else {
      sql = `SELECT COUNT(*) AS record_count FROM dataset${whereClause}`;
      explanation = `Counts total matching records in dataset${whereClause ? ` under specified criteria` : ''}.`;
    }
    return {
      sql,
      explanation,
      suggestedChart: matchedEntityCol ? 'bar' : 'table',
      canAnswer: true,
      intent: 'count',
      matchedEntityCol,
      matchedMetricCol: metricCol,
      filtersApplied: filters,
    };
  }

  // Case B: Pure Scalar Average or Total without Grouping (e.g. "what is the average return rate?", "total revenue")
  // Only if no entity is specified or no superlative ranking requested
  if ((isAverage || isTotal) && !isHighRanking && !isLowRanking && (!matchedEntityCol || (!qLower.includes('which') && !qLower.includes('by ') && !qLower.includes('each ')))) {
    const agg = isAverage ? 'AVG' : 'SUM';
    const alias = isAverage ? `avg_${metricCol}` : `total_${metricCol}`;
    const sql = `SELECT ${agg}(${metricCol}) AS ${alias} FROM dataset${whereClause}`;
    const explanation = `Calculates overall ${agg.toLowerCase()} of ${metricCol.replace(/_/g, ' ')}${whereClause ? ` with filters` : ''}.`;
    return {
      sql,
      explanation,
      suggestedChart: 'table',
      canAnswer: true,
      intent: isAverage ? 'average' : 'total',
      matchedMetricCol: metricCol,
      filtersApplied: filters,
    };
  }

  // Case C: Ranking or Grouping (e.g. "which department has the highest sales in first quarter", "top 5 campaigns by roas")
  const entityCol = matchedEntityCol || defaultCat;
  const aggFunc = isRateOrPct ? 'AVG' : defaultAggFunc;
  const alias = `${aggFunc.toLowerCase()}_${metricCol}`;
  const sortDir = isLowRanking ? 'ASC' : 'DESC';
  const limit = explicitLimit || (isHighRanking || isLowRanking ? 5 : 10);

  const sql = `SELECT ${entityCol}, ${aggFunc}(${metricCol}) AS ${alias} FROM dataset${whereClause} GROUP BY ${entityCol} ORDER BY ${alias} ${sortDir} LIMIT ${limit}`;
  const explanation = `${sortDir === 'DESC' ? 'Ranks top' : 'Identifies lowest'} ${entityCol.replace(/_/g, ' ')} entities by ${aggFunc.toLowerCase()} ${metricCol.replace(/_/g, ' ')}${whereClause ? ` under applied filters` : ''}.`;

  return {
    sql,
    explanation,
    suggestedChart: 'bar',
    canAnswer: true,
    intent: isLowRanking ? 'ranking_low' : 'ranking_high',
    matchedEntityCol: entityCol,
    matchedMetricCol: metricCol,
    filtersApplied: filters,
  };
}
