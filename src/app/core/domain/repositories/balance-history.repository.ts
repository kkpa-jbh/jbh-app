import { Observable } from 'rxjs';
import { MonthlyBalanceRequest, BalanceHistoryModel } from '../features/balance-history';

export abstract class BalanceHistoryRepository {
  abstract getProductBalances(productId: string, request: MonthlyBalanceRequest): Observable<BalanceHistoryModel>;
  abstract getAllBalances(request: MonthlyBalanceRequest): Observable<BalanceHistoryModel>;
}
