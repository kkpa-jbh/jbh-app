import { MovementType, CategoryTypeApiResponse, MovementMetadata } from '../../types/movement.types';

export interface MovementResponse {
  id: { value: string };
  productId: { value: string };
  movementType: MovementType;
  category: CategoryTypeApiResponse | null;
  movementAmount: number;
  movementDate: string;
  balanceSnapshot: number | null;
  metadata: MovementMetadata;
  createdAt: string;
  description: string | null;
  canBeRemoved: boolean;
}
