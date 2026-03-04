import { MovementType } from '../../types/movement.types';

export interface CategoryTypeApiRequest {
  source: 'INCOME' | 'EXPENSE';
  alias: string;
}

export interface CategoryApiRequest {
  categoryId: number;
  categoryType: CategoryTypeApiRequest;
}

export interface AddMovementRequest {
  entryDate: string;
  totalAmount: number | null;
  balanceSnapshot: number | null;
  movementType: MovementType;
  categoryRequest: CategoryApiRequest | null;
  description: string | null;
}
