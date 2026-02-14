import { CategoryType, MovementMetadata, MovementType, ProductMovementApiResponse } from './product-movement-api-response.interface';

export class ProductMovement {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly movementType: MovementType,
    public readonly category: CategoryType | null,
    public readonly movementAmount: number,
    public readonly movementDate: string,
    public readonly balanceSnapshot: number,
    public readonly metadata: MovementMetadata,
    public readonly createdAt: string,
    public readonly description: string,
    public readonly canBeRemoved?: boolean
  ) {}

  static fromApiResponse(response: ProductMovementApiResponse): ProductMovement {
    return new ProductMovement(
      response.id,
      response.productId,
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
    return this.metadata['TARGET_INTERNAL_ACCOUNT_NAME'] || null;
  }

  get categoryLabel(): string | null {
    return this.category?.typeName || null;
  }
}
