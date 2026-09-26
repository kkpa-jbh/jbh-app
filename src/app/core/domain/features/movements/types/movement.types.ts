/**
 * Type of movement that can be performed on a product.
 *
 * DEPOSIT: Money added to the account
 * WITHDRAWAL: Money taken out of the account
 * BALANCE_SNAPSHOT: Manual balance recording for reconciliation
 */
export type MovementType = 'DEPOSIT' | 'WITHDRAWAL' | 'BALANCE_SNAPSHOT';

/**
 * Category type as returned by the API inside a movement response.
 */
export interface CategoryTypeApiResponse {
  source: 'INCOME' | 'EXPENSE';
  alias: string;
  displayName?: Record<string, string>;
}

/**
 * Metadata attached to a movement.
 * Can store arbitrary key-value pairs for additional information.
 */
export interface MovementMetadata {
  [key: string]: any;
}
