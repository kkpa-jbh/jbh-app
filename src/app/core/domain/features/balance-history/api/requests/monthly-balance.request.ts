/**
 * API Request Interface
 *
 * Request payload for fetching balance history.
 * Sent to both single-product and all-products endpoints.
 */

export interface MonthlyBalanceRequest {
  /** Start of the date range in "YYYY-MM" format (e.g., "2024-01"). */
  startPeriod: string;

  /** End of the date range in "YYYY-MM" format (e.g., "2024-12"). */
  endPeriod: string;
}
