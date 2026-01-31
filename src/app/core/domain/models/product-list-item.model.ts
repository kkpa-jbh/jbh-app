export type ProductTypeName =
  | 'SAVINGS'
  | 'REAL_ESTATE_INVESTMENT'
  | 'LOAN'
  | 'CREDIT_CARD'
  | 'INVESTMENT'
  | 'CDT';

export type ProductMetadataKey =
  | 'CREDIT_LIMIT'
  | 'PAYMENT_DUE_DAY'
  | 'BROKER_NAME'
  | 'COMMISSION_RATE'
  | 'MATURITY_DATE'
  | 'OPENING_DATE'
  | 'TERM_LENGTH_IN_DAYS'
  | 'COMMON_INITIAL_BALANCE'
  | 'COMMON_IS_FULLY_WITHDRAWN'
  | 'COMMON_FULLY_WITHDRAWN_DATE'
  | 'COMMON_FULLY_WITHDRAWN_AT'
  | 'LOAN_PRINCIPAL_AMOUNT'
  | 'LOAN_INTEREST_RATE'
  | 'LOAN_TOTAL_AMOUNT_PAID'
  | 'LOAN_PAYOFF_AMOUNT_TODAY'
  | 'REAL_ESTATE_PURCHASE_DATE'
  | 'REAL_ESTATE_PURCHASE_PRICE'
  | 'REAL_ESTATE_PROPERTY_SIZE'
  | 'REAL_ESTATE_RENTAL_INCOME'
  | 'REAL_ESTATE_FINANCED_AMOUNT'
  | 'REAL_ESTATE_DOWN_PAYMENT_AMOUNT'
  | 'REAL_ESTATE_DOWN_PAYMENT_PERCENTAGE'
  | 'REAL_ESTATE_DOWN_PAYMENT_PAID_TO_DATE';

export interface ProductIdApiResponse {
  value: string;
}

export interface ProductMetadataApiResponse {
  data: Record<string, unknown>;
}

export interface ProductListItemApiResponse {
  id: ProductIdApiResponse;
  name: string;
  type: ProductTypeName;
  userId: string;
  movementBalance: number;
  currentBalance: number;
  netProfitBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  netGrowthRate: number;
  metadata: ProductMetadataApiResponse;
}

export class ProductListItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: ProductTypeName,
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

  static fromApiResponse(response: ProductListItemApiResponse): ProductListItem {
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
    const movementAllowedTypes: ProductTypeName[] = ['SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CDT'];
    return movementAllowedTypes.includes(this.type);
  }

  getTypeIcon(): string {
    const iconMap: Record<ProductTypeName, string> = {
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
    const colorMap: Record<ProductTypeName, string> = {
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
