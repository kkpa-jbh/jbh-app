import { MovementType, CategoryType, MovementMetadata } from '../../types/movement.types';

export interface MovementResponse {
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
