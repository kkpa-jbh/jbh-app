export type MovementType = 'DEPOSIT' | 'WITHDRAWAL' | 'BALANCE_SNAPSHOT';

export interface CategoryType {
  source: 'INCOME' | 'EXPENSE';
  typeName: string;
  translationsKey: string;
}

export interface MovementMetadata {
  [key: string]: any;
}

export interface ProductMovementApiResponse {
  id: string;
  productId: string;
  movementType: MovementType;
  category: CategoryType | null;
  movementAmount: number;
  movementDate: string;
  balanceSnapshot: number;
  metadata: MovementMetadata;
  createdAt: string;
  description: string;
  canBeRemoved: boolean;
}
