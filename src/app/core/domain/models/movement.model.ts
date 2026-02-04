export type MovementType = 'DEPOSIT' | 'WITHDRAWAL' | 'BALANCE_SNAPSHOT';

export interface AddMovementRequest {
  entryDate: string;
  movementType: MovementType;
  totalAmount?: number;
  categoryName?: string;
  balanceSnapshot?: number;
}

export interface AddMovementResponse {
  id: string;
  productId: string;
  entryDate: string;
  movementType: MovementType;
  totalAmount?: number;
  categoryName?: string;
  balanceSnapshot?: number;
  createdAt: string;
}
