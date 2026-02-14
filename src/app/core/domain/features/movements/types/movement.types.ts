/**
 * Type of movement that can be performed on a product.
 *
 * DEPOSIT: Money added to the account
 * WITHDRAWAL: Money taken out of the account
 * BALANCE_SNAPSHOT: Manual balance recording for reconciliation
 */
export type MovementType = 'DEPOSIT' | 'WITHDRAWAL' | 'BALANCE_SNAPSHOT';

/**
 * Category information for a movement.
 * Used to classify movements as income or expense.
 */
export interface CategoryType {
  source: 'INCOME' | 'EXPENSE';
  typeName: string;
  translationsKey: string;
}

/**
 * Metadata attached to a movement.
 * Can store arbitrary key-value pairs for additional information.
 */
export interface MovementMetadata {
  [key: string]: any;
}
