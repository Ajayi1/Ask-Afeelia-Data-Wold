export interface SampleDataset {
  id: string;
  name: string;
  filename: string;
  problem: string;
  objective: string;
  rows: Record<string, any>[];
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'sales-decline',
    name: 'Regional Sales & Revenue Loss',
    filename: 'regional_sales_q1_q4.xlsx',
    problem: 'Why are sales declining in the North?',
    objective: 'Identify the top 3 drivers of decline.',
    rows: [
      { region: 'North', quarter: 'Q1', category: 'Hardware', revenue: 420000, target: 400000, units_sold: 2100, discount_pct: 5.0, return_rate: 2.1, customer_churn: 12 },
      { region: 'North', quarter: 'Q2', category: 'Hardware', revenue: 380000, target: 410000, units_sold: 1900, discount_pct: 7.5, return_rate: 3.4, customer_churn: 18 },
      { region: 'North', quarter: 'Q3', category: 'Hardware', revenue: 310000, target: 420000, units_sold: 1550, discount_pct: 12.0, return_rate: 6.8, customer_churn: 45 },
      { region: 'North', quarter: 'Q4', category: 'Hardware', revenue: 240000, target: 430000, units_sold: 1200, discount_pct: 18.5, return_rate: 9.2, customer_churn: 68 },
      { region: 'North', quarter: 'Q1', category: 'Software', revenue: 290000, target: 280000, units_sold: 1450, discount_pct: 4.0, return_rate: 1.2, customer_churn: 8 },
      { region: 'North', quarter: 'Q2', category: 'Software', revenue: 275000, target: 290000, units_sold: 1375, discount_pct: 6.0, return_rate: 1.5, customer_churn: 11 },
      { region: 'North', quarter: 'Q3', category: 'Software', revenue: 250000, target: 300000, units_sold: 1250, discount_pct: 8.0, return_rate: 2.0, customer_churn: 22 },
      { region: 'North', quarter: 'Q4', category: 'Software', revenue: 220000, target: 310000, units_sold: 1100, discount_pct: 11.0, return_rate: 2.8, customer_churn: 31 },
      { region: 'North', quarter: 'Q1', category: 'Services', revenue: 150000, target: 140000, units_sold: 750, discount_pct: 2.0, return_rate: 0.8, customer_churn: 4 },
      { region: 'North', quarter: 'Q2', category: 'Services', revenue: 145000, target: 150000, units_sold: 725, discount_pct: 3.5, return_rate: 1.1, customer_churn: 6 },
      { region: 'North', quarter: 'Q3', category: 'Services', revenue: 135000, target: 155000, units_sold: 675, discount_pct: 5.0, return_rate: 1.4, customer_churn: 12 },
      { region: 'North', quarter: 'Q4', category: 'Services', revenue: 110000, target: 160000, units_sold: 550, discount_pct: 8.0, return_rate: 2.1, customer_churn: 19 },
      { region: 'South', quarter: 'Q1', category: 'Hardware', revenue: 390000, target: 380000, units_sold: 1950, discount_pct: 4.5, return_rate: 2.0, customer_churn: 9 },
      { region: 'South', quarter: 'Q2', category: 'Hardware', revenue: 410000, target: 390000, units_sold: 2050, discount_pct: 5.0, return_rate: 2.2, customer_churn: 10 },
      { region: 'South', quarter: 'Q3', category: 'Hardware', revenue: 435000, target: 410000, units_sold: 2175, discount_pct: 5.5, return_rate: 2.3, customer_churn: 12 },
      { region: 'South', quarter: 'Q4', category: 'Hardware', revenue: 460000, target: 430000, units_sold: 2300, discount_pct: 6.0, return_rate: 2.5, customer_churn: 14 },
      { region: 'South', quarter: 'Q1', category: 'Software', revenue: 310000, target: 300000, units_sold: 1550, discount_pct: 3.5, return_rate: 1.1, customer_churn: 5 },
      { region: 'South', quarter: 'Q2', category: 'Software', revenue: 330000, target: 320000, units_sold: 1650, discount_pct: 4.0, return_rate: 1.2, customer_churn: 7 },
      { region: 'South', quarter: 'Q3', category: 'Software', revenue: 355000, target: 340000, units_sold: 1775, discount_pct: 4.5, return_rate: 1.3, customer_churn: 8 },
      { region: 'South', quarter: 'Q4', category: 'Software', revenue: 380000, target: 360000, units_sold: 1900, discount_pct: 5.0, return_rate: 1.4, customer_churn: 9 },
      { region: 'East', quarter: 'Q1', category: 'Hardware', revenue: 360000, target: 350000, units_sold: 1800, discount_pct: 4.0, return_rate: 1.8, customer_churn: 8 },
      { region: 'East', quarter: 'Q2', category: 'Hardware', revenue: 375000, target: 360000, units_sold: 1875, discount_pct: 4.2, return_rate: 1.9, customer_churn: 9 },
      { region: 'East', quarter: 'Q3', category: 'Hardware', revenue: 390000, target: 375000, units_sold: 1950, discount_pct: 4.5, return_rate: 2.1, customer_churn: 10 },
      { region: 'East', quarter: 'Q4', category: 'Hardware', revenue: 410000, target: 390000, units_sold: 2050, discount_pct: 5.0, return_rate: 2.2, customer_churn: 11 },
      { region: 'West', quarter: 'Q1', category: 'Hardware', revenue: 450000, target: 440000, units_sold: 2250, discount_pct: 3.5, return_rate: 1.5, customer_churn: 7 },
      { region: 'West', quarter: 'Q2', category: 'Hardware', revenue: 470000, target: 450000, units_sold: 2350, discount_pct: 4.0, return_rate: 1.6, customer_churn: 8 },
      { region: 'West', quarter: 'Q3', category: 'Hardware', revenue: 495000, target: 470000, units_sold: 2475, discount_pct: 4.2, return_rate: 1.7, customer_churn: 9 },
      { region: 'West', quarter: 'Q4', category: 'Hardware', revenue: 520000, target: 490000, units_sold: 2600, discount_pct: 4.5, return_rate: 1.8, customer_churn: 10 }
    ]
  },
  {
    id: 'customer-churn',
    name: 'Customer Churn & Retention Cohorts',
    filename: 'customer_churn_telecom.csv',
    problem: 'Why is monthly subscriber churn rising in contract tiers?',
    objective: 'Identify the top 3 drivers of customer churn and revenue at risk.',
    rows: [
      { customer_id: 'CUST-1001', segment: 'Enterprise', contract: 'Month-to-Month', tenure_months: 4, monthly_charges: 185.50, support_tickets: 6, churned: 1, satisfaction_score: 3.1 },
      { customer_id: 'CUST-1002', segment: 'Enterprise', contract: 'One-Year', tenure_months: 24, monthly_charges: 145.00, support_tickets: 1, churned: 0, satisfaction_score: 8.5 },
      { customer_id: 'CUST-1003', segment: 'SMB', contract: 'Month-to-Month', tenure_months: 2, monthly_charges: 95.00, support_tickets: 5, churned: 1, satisfaction_score: 2.8 },
      { customer_id: 'CUST-1004', segment: 'Consumer', contract: 'Month-to-Month', tenure_months: 8, monthly_charges: 65.20, support_tickets: 4, churned: 1, satisfaction_score: 4.2 },
      { customer_id: 'CUST-1005', segment: 'SMB', contract: 'Two-Year', tenure_months: 36, monthly_charges: 110.00, support_tickets: 0, churned: 0, satisfaction_score: 9.4 },
      { customer_id: 'CUST-1006', segment: 'Enterprise', contract: 'Month-to-Month', tenure_months: 6, monthly_charges: 210.00, support_tickets: 7, churned: 1, satisfaction_score: 2.5 },
      { customer_id: 'CUST-1007', segment: 'Enterprise', contract: 'Two-Year', tenure_months: 48, monthly_charges: 195.00, support_tickets: 1, churned: 0, satisfaction_score: 9.0 },
      { customer_id: 'CUST-1008', segment: 'SMB', contract: 'Month-to-Month', tenure_months: 3, monthly_charges: 85.00, support_tickets: 4, churned: 1, satisfaction_score: 3.4 },
      { customer_id: 'CUST-1009', segment: 'Consumer', contract: 'One-Year', tenure_months: 18, monthly_charges: 55.00, support_tickets: 1, churned: 0, satisfaction_score: 8.0 },
      { customer_id: 'CUST-1010', segment: 'Enterprise', contract: 'Month-to-Month', tenure_months: 5, monthly_charges: 240.00, support_tickets: 8, churned: 1, satisfaction_score: 2.1 },
      { customer_id: 'CUST-1011', segment: 'SMB', contract: 'One-Year', tenure_months: 15, monthly_charges: 120.00, support_tickets: 2, churned: 0, satisfaction_score: 7.8 },
      { customer_id: 'CUST-1012', segment: 'Consumer', contract: 'Month-to-Month', tenure_months: 1, monthly_charges: 70.00, support_tickets: 5, churned: 1, satisfaction_score: 2.9 },
      { customer_id: 'CUST-1013', segment: 'Enterprise', contract: 'One-Year', tenure_months: 30, monthly_charges: 175.00, support_tickets: 2, churned: 0, satisfaction_score: 8.2 },
      { customer_id: 'CUST-1014', segment: 'Consumer', contract: 'Two-Year', tenure_months: 42, monthly_charges: 60.00, support_tickets: 0, churned: 0, satisfaction_score: 9.6 },
      { customer_id: 'CUST-1015', segment: 'SMB', contract: 'Month-to-Month', tenure_months: 4, monthly_charges: 105.00, support_tickets: 6, churned: 1, satisfaction_score: 3.0 }
    ]
  },
  {
    id: 'marketing-roas',
    name: 'E-Commerce Marketing Channel ROI',
    filename: 'marketing_campaign_performance.xlsx',
    problem: 'Why has overall ROAS dropped from 3.8x to 2.1x across paid media?',
    objective: 'Determine which ad channels are underperforming and identify budget reallocation targets.',
    rows: [
      { channel: 'Paid Search', campaign: 'Brand Core', ad_spend: 35000, conversions: 1400, revenue: 175000, cpa: 25.0, roas: 5.0, bounce_rate: 22.0 },
      { channel: 'Paid Search', campaign: 'Generic High-Intent', ad_spend: 52000, conversions: 1100, revenue: 137500, cpa: 47.3, roas: 2.6, bounce_rate: 34.5 },
      { channel: 'Paid Social', campaign: 'Prospecting Video', ad_spend: 68000, conversions: 620, revenue: 77500, cpa: 109.7, roas: 1.1, bounce_rate: 68.2 },
      { channel: 'Paid Social', campaign: 'Retargeting Dynamic', ad_spend: 28000, conversions: 980, revenue: 122500, cpa: 28.6, roas: 4.4, bounce_rate: 28.0 },
      { channel: 'Influencer', campaign: 'Micro-Tier Launch', ad_spend: 22000, conversions: 310, revenue: 38750, cpa: 71.0, roas: 1.8, bounce_rate: 59.0 },
      { channel: 'Email/Lifecycle', campaign: 'Win-Back Sequence', ad_spend: 6500, conversions: 840, revenue: 105000, cpa: 7.7, roas: 16.2, bounce_rate: 14.0 },
      { channel: 'Display/Programmatic', campaign: 'Broad Awareness', ad_spend: 44000, conversions: 290, revenue: 36250, cpa: 151.7, roas: 0.8, bounce_rate: 76.5 },
      { channel: 'Affiliate', campaign: 'Premium Publishers', ad_spend: 19000, conversions: 650, revenue: 81250, cpa: 29.2, roas: 4.3, bounce_rate: 25.0 }
    ]
  }
];
