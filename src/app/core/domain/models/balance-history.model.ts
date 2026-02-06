/**
 * Domain Models for Balance History
 *
 * These models represent application-level data and are independent from the API shape.
 * They include computed properties and helper methods as needed for business logic.
 *
 * Mapping Flow: API Response → Domain Model
 */

import {
  BalanceHistoryResponse,
  BalanceHistorySummaryResponse,
  BalanceHistoryEntryResponse
} from './balance-history-response.interface';

/**
 * Request payload for fetching balance history.
 * Sent to both single-product and all-products endpoints.
 */
export interface MonthlyBalanceRequest {
  /** Start of the date range in "YYYY-MM" format (e.g., "2024-01"). */
  startPeriod: string;

  /** End of the date range in "YYYY-MM" format (e.g., "2024-12"). */
  endPeriod: string;
}

/**
 * Domain model for balance history summary statistics.
 * Contains pre-calculated metrics from the backend.
 */
export class BalanceHistorySummaryModel {
  constructor(
    /** Current total balance at the end of the period */
    public readonly totalBalance: number,
    /** Net monetary change during the selected period */
    public readonly periodChange: number,
    /** Percentage change relative to the initial balance */
    public readonly periodChangePercent: number,
    /** Average monthly growth rate across the period */
    public readonly avgGrowthRate: number,
    /** Total number of transactions across all selected records */
    public readonly totalMovements: number
  ) {}

  /**
   * Factory method to create from API response.
   * Direct mapping as no transformation is needed.
   */
  static fromResponse(response: BalanceHistorySummaryResponse): BalanceHistorySummaryModel {
    return new BalanceHistorySummaryModel(
      response.totalBalance,
      response.periodChange,
      response.periodChangePercent,
      response.avgGrowthRate,
      response.totalMovements
    );
  }
}

/**
 * Domain model representing a monthly balance history entry.
 * Immutable class that maps from API response.
 */
export class BalanceHistoryEntryModel {
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
    /** True when profit > 0 */
    public readonly isProfitable: boolean,
    /** True when profit < 0 */
    public readonly isLoss: boolean,
    /** Total amount of debits during the month */
    public readonly totalDebits: number,
    /** Total amount of credits during the month */
    public readonly totalCredits: number
  ) {}

  /**
   * Factory method to create from API response.
   * Direct mapping as the API already returns the correct format.
   */
  static fromResponse(response: BalanceHistoryEntryResponse): BalanceHistoryEntryModel {
    return new BalanceHistoryEntryModel(
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
      response.isProfitable,
      response.isLoss,
      response.totalDebits,
      response.totalCredits
    );
  }
}

/**
 * Main domain model for balance history.
 * Contains summary statistics and monthly entries.
 */
export class BalanceHistoryModel {
  constructor(
    public readonly summary: BalanceHistorySummaryModel,
    public readonly balances: BalanceHistoryEntryModel[]
  ) {}

  /**
   * Factory method to create from API response.
   * Maps both summary and balance entries.
   */
  static fromResponse(response: BalanceHistoryResponse): BalanceHistoryModel {
    return new BalanceHistoryModel(
      BalanceHistorySummaryModel.fromResponse(response.summary),
      response.balances.map(entry => BalanceHistoryEntryModel.fromResponse(entry))
    );
  }
}
