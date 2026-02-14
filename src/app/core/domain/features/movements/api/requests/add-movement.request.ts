import { MovementType } from '../../types/movement.types';

export interface AddMovementRequest {
  entryDate: string;
  movementType: MovementType;
  totalAmount?: number;
  categoryName?: string;
  balanceSnapshot?: number;
  description?: string;
}
