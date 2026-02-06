/**
 * API Response Interfaces (HTTP Boundary)
 *
 * These interfaces MUST exactly match the backend API response objects.
 * DO NOT modify these to fit UI needs - create Models for that purpose.
 *
 * @see /notes/pages/balance_history/api-response-schema.md
 */

/**
 * Main response object for balance history API endpoints.
 * Endpoint: POST /finance/products/monthly-balances/{productId}
 * Endpoint: POST /finance/products/monthly-balances/
 */
export interface BalanceHistoryResponse {
  summary: BalanceHistorySummaryResponse;
  balances: BalanceHistoryEntryResponse[];
}

/**
 * Summary statistics for the entire balance history period.
 * All calculations are performed by the backend.
 */
export interface BalanceHistorySummaryResponse {
  /** The current total balance at the end of the selected period.
   * Sum of closing balances across all products for the latest month. */
  totalBalance: number;

  /** How much the balance grew (or shrank) during this period */
  periodChange: number;

  /** Percentage change over the selected period */
  periodChangePercent: number;

  /** The average monthly growth rate across the period.
   * On average, balance grew by this percentage each month */
  avgGrowthRate: number;

  /** The total number of transactions/movements during the period */
  totalMovements: number;
}

/**
 * Detailed month-by-month breakdown of balance data for a specific product.
 * Each entry represents one month of balance history.
 */
export interface BalanceHistoryEntryResponse {
  /** Period in YYYY-MM format (e.g., "2024-01") */
  period: string;

  /** Opening balance at the start of the period */
  openingBalance: number;

  /** Closing balance at the end of the period */
  closingBalance: number;

  /** Profit for the period (uses official report if available, otherwise net profit) */
  profit: number;

  /** Growth rate percentage for the period */
  growthRate: number;

  /** Number of movements/transactions in this period */
  movementCount: number;

  /** True if this period has missing data (gap in records) */
  isGapPeriod: boolean;

  /** True if this period has an official monthly report */
  isOfficialReport: boolean;

  /** Product identifier as UUID string */
  productId: string;

  /** Human-readable product name */
  productName: string;

  /** True if the period was profitable (profit > 0) */
  isProfitable: boolean;

  /** True if the period resulted in a loss (profit < 0) */
  isLoss: boolean;

  /** Total debit movements for the period */
  totalDebits: number;

  /** Total credit movements for the period */
  totalCredits: number;
}
