import { Observable } from 'rxjs';
import { MonthlyBalanceRequest, BalanceHistoryModel } from '../models/balance-history.model';

export abstract class BalanceHistoryRepository {
  abstract getProductBalances(productId: string, request: MonthlyBalanceRequest): Observable<BalanceHistoryModel>;
  abstract getAllBalances(request: MonthlyBalanceRequest): Observable<BalanceHistoryModel>;
}
