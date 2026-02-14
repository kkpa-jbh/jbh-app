import { ProductIdApiResponse } from './product-id-api.response';
import { ProductMetadataApiResponse } from './product-metadata-api.response';

export type ProductTypeName =
  | 'SAVINGS'
  | 'REAL_ESTATE_INVESTMENT'
  | 'LOAN'
  | 'CREDIT_CARD'
  | 'INVESTMENT'
  | 'CDT';

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
