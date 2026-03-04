import { ProductResponse } from '@core/domain/features/products';
import { MovementResponse } from './product-movement-api.response';
import { MonthlyBalanceApiResponse } from './monthly-balance-api.response';

export interface AddMovementApiResponse {
  productresponse: ProductResponse;
  movement: MovementResponse;
  monthlyBalance: MonthlyBalanceApiResponse;
}
