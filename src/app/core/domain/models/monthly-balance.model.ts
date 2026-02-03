/**
 * API response structure for a single monthly balance record.
 * All values are pre-calculated by the backend.
 */
export interface MonthlyBalanceApiResponse {
  /** Period identifier in "YYYY-MM" format (e.g., "2024-01"). Used for sorting and filtering. */
  period: string;

  /** Balance at the start of the month (first day). */
  openingBalance: number;

  /** Balance at the end of the month (last day). */
  closingBalance: number;

  /** Net profit or loss for the month. Positive = gain, Negative = loss. */
  profit: number;

  /** Percentage growth for the month. Calculated as: ((closing - opening) / opening) × 100 */
  growthRate: number;

  /** Number of transactions (deposits, withdrawals, transfers) during the month. */
  movementCount: number;

  /** Indicates no actual data exists for this period (product didn't exist, was closed, or had no activity). */
  isGapPeriod: boolean;

  /** Data comes from an official bank/institution statement. */
  isOfficialReport: boolean;

  /** Unique identifier for the product (UUID). */
  productId: string;

  /** User-friendly name of the product (e.g., "Main Savings Account"). */
  productName: string;

  /** Human-readable period label, pre-formatted by backend (e.g., "Jan 2024"). */
  periodLabel: string;

  /** Pre-calculated flag: true when profit > 0 */
  isProfitable: boolean;

  /** Pre-calculated flag: true when profit < 0 */
  isLoss: boolean;
}

/**
 * Complete API response wrapper for balance history endpoints.
 * Contains pre-calculated summary metrics and individual balance records.
 */
export interface BalanceHistoryResponseApi {
  /** Aggregated metrics for the entire selected period. */
  summary: BalanceHistorySummary;

  /** Array of individual monthly balance records. */
  balances: MonthlyBalanceApiResponse[];
}

/**
 * Request payload for fetching balance history.
 */
export interface MonthlyBalanceRequest {
  /** Start of the date range in "YYYY-MM" format (e.g., "2024-01"). */
  startPeriod: string;

  /** End of the date range in "YYYY-MM" format (e.g., "2024-12"). */
  endPeriod: string;
}

/**
 * Pre-calculated summary metrics for the balance history period.
 * All calculations are performed by the backend.
 *
 * @description
 * For single product requests:
 * - totalBalance: Latest closing balance
 * - periodChange: Last closing - First opening
 * - periodChangePercent: (periodChange / first opening) × 100
 * - avgGrowthRate: Average of all monthly growth rates
 * - totalMovements: Sum of all movementCount values
 *
 * For all products requests:
 * - totalBalance: Sum of latest closing balances for each product
 * - periodChange: Sum of (last closing - first opening) for each product
 * - periodChangePercent: (periodChange / sum of first openings) × 100
 * - avgGrowthRate: Weighted average: Σ(growthRate × closingBalance) / Σ(closingBalance)
 * - totalMovements: Sum of all movementCount values across all products
 */
export interface BalanceHistorySummary {
  /**
   * Current total balance at the end of the period.
   * Single product: Latest closing balance.
   * All products: Sum of latest closing balances.
   */
  totalBalance: number;

  /**
   * Net monetary change during the selected period.
   * Positive = overall gain, Negative = overall loss.
   */
  periodChange: number;

  /**
   * Percentage change relative to the initial balance.
   * Calculated as: (periodChange / initial balance) × 100
   */
  periodChangePercent: number;

  /**
   * Average monthly growth rate across the period.
   * For all products: weighted by balance size.
   */
  avgGrowthRate: number;

  /** Total number of transactions across all selected records. */
  totalMovements: number;
}

/**
 * Domain model representing a monthly balance record.
 * Immutable class that maps from API response.
 *
 * @see MonthlyBalanceApiResponse for field descriptions
 * @see /notes/pages/balance_history/api-response-schema.md for complete documentation
 */
export class MonthlyBalance {
  constructor(
    /** Period identifier in "YYYY-MM" format */
    public readonly period: string,
    /** Balance at the start of the month */
    public readonly openingBalance: number,
    /** Balance at the end of the month */
    public readonly closingBalance: number,
    /** Net profit or loss for the month */
    public readonly profit: number,
    /** Percentage growth for the month */
    public readonly growthRate: number,
    /** Number of transactions during the month */
    public readonly movementCount: number,
    /** True if no actual data exists for this period */
    public readonly isGapPeriod: boolean,
    /** True if data comes from official statement */
    public readonly isOfficialReport: boolean,
    /** Product unique identifier */
    public readonly productId: string,
    /** Product display name */
    public readonly productName: string,
    /** Human-readable period label (e.g., "Jan 2024") */
    public readonly periodLabel: string,
    /** True when profit > 0 */
    public readonly isProfitable: boolean,
    /** True when profit < 0 */
    public readonly isLoss: boolean
  ) {}

  /**
   * Factory method to create a MonthlyBalance from API response.
   * @param response - The raw API response object
   * @returns A new MonthlyBalance instance
   */
  static fromApiResponse(response: MonthlyBalanceApiResponse): MonthlyBalance {
    return new MonthlyBalance(
      response.period,
      response.openingBalance,
      response.closingBalance,
      response.profit,
      response.growthRate,
      response.movementCount,
      response.isGapPeriod,
      response.isOfficialReport,
      response.productId,
      response.productName,
      response.periodLabel,
      response.isProfitable,
      response.isLoss
    );
  }
}
