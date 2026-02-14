import { ProductResponse, ProductType } from '../api/responses/product-api.response';

export class ProductListItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: ProductType,
    public readonly userId: string,
    public readonly movementBalance: number,
    public readonly currentBalance: number,
    public readonly netProfitBalance: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly netGrowthRate: number,
    public readonly metadata: Record<string, unknown>
  ) {}

  static fromApiResponse(response: ProductResponse): ProductListItem {
    return new ProductListItem(
      response.id.value,
      response.name,
      response.type,
      response.userId,
      response.movementBalance,
      response.currentBalance,
      response.netProfitBalance,
      response.isActive,
      new Date(response.createdAt),
      new Date(response.updatedAt),
      response.netGrowthRate,
      response.metadata?.data || {}
    );
  }

  get isFullyWithdrawn(): boolean {
    return this.metadata['COMMON_IS_FULLY_WITHDRAWN'] === true;
  }

  get fullyWithdrawnDate(): Date | null {
    const dateStr = this.metadata['COMMON_FULLY_WITHDRAWN_DATE'] as string;
    return dateStr ? new Date(dateStr) : null;
  }

  get initialBalance(): number | null {
    const value = this.metadata['COMMON_INITIAL_BALANCE'];
    return typeof value === 'number' ? value : null;
  }

  get isProfitable(): boolean {
    return this.netProfitBalance > 0;
  }

  get isLoss(): boolean {
    return this.netProfitBalance < 0;
  }

  get allowsMovements(): boolean {
    const movementAllowedTypes: ProductType[] = ['SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CDT'];
    return movementAllowedTypes.includes(this.type);
  }

  getTypeIcon(): string {
    const iconMap: Record<ProductType, string> = {
      'SAVINGS': 'wallet-outline',
      'REAL_ESTATE_INVESTMENT': 'home-outline',
      'LOAN': 'cash-outline',
      'CREDIT_CARD': 'card-outline',
      'INVESTMENT': 'trending-up-outline',
      'CDT': 'time-outline'
    };
    return iconMap[this.type] || 'cube-outline';
  }

  getTypeColor(): string {
    const colorMap: Record<ProductType, string> = {
      'SAVINGS': '#48bb78',
      'REAL_ESTATE_INVESTMENT': '#ed8936',
      'LOAN': '#f56565',
      'CREDIT_CARD': '#667eea',
      'INVESTMENT': '#38b2ac',
      'CDT': '#9f7aea'
    };
    return colorMap[this.type] || '#718096';
  }
}
