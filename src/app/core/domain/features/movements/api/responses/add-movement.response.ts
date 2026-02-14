import { MovementType } from '../../types/movement.types';

export interface AddMovementResponse {
  id: string;
  productId: string;
  entryDate: string;
  movementType: MovementType;
  totalAmount?: number;
  categoryName?: string;
  balanceSnapshot?: number;
  description?: string;
  createdAt: string;
}
