import { ProductId } from './product-id-api.response';
import { ProductMetadataResponse } from './product-metadata-api.response';

export type ProductTypeCode =
  | 'SAVINGS'
  | 'REAL_ESTATE_INVESTMENT'
  | 'LOAN'
  | 'CREDIT_CARD'
  | 'INVESTMENT'
  | 'CDT'
  | string; // open for new backend types

export interface ProductResponse {
  id: ProductId;
  name: string;
  type: ProductTypeCode;
  userId: string;
  movementBalance: number;
  currentBalance: number;
  netProfitBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  netGrowthRate: number;
  metadata: ProductMetadataResponse;
}
