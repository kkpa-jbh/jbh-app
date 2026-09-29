import { MovementResponse } from '../api/responses/product-movement-api.response';
import { MovementType, CategoryTypeApiResponse, MovementMetadata } from '../types/movement.types';

export class ProductMovement {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly movementType: MovementType,
    public readonly category: CategoryTypeApiResponse | null,
    public readonly movementAmount: number,
    public readonly movementDate: string,
    public readonly balanceSnapshot: number | null,
    public readonly metadata: MovementMetadata,
    public readonly createdAt: string,
    public readonly description: string | null,
    public readonly canBeRemoved?: boolean
  ) {}

  static fromApiResponse(response: MovementResponse): ProductMovement {
    return new ProductMovement(
      response.id.value,
      response.productId.value,
      response.movementType,
      response.category,
      response.movementAmount,
      response.movementDate,
      response.balanceSnapshot,
      response.metadata,
      response.createdAt,
      response.description,
      response.canBeRemoved
    );
  }

  get isDeposit(): boolean {
    return this.movementType === 'DEPOSIT';
  }

  get isWithdrawal(): boolean {
    return this.movementType === 'WITHDRAWAL';
  }

  get isBalanceSnapshot(): boolean {
    return this.movementType === 'BALANCE_SNAPSHOT';
  }

  get hasTargetAccount(): boolean {
    return !!(this.metadata['TARGET_INTERNAL_ACCOUNT_NAME'] || this.metadata['TARGET_INTERNAL_ACCOUNT_ID']);
  }

  get targetAccountName(): string | null {
    const name = this.metadata['TARGET_INTERNAL_ACCOUNT_NAME'];
    return typeof name === 'string' && name ? name : null;
  }

  get categoryLabel(): string | null {
    return this.category?.alias || null;
  }
}
