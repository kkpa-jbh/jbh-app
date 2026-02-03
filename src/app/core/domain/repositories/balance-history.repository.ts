import { Observable } from 'rxjs';
import { MonthlyBalance, MonthlyBalanceRequest, BalanceHistorySummary } from '../models/monthly-balance.model';

export interface BalanceHistoryResult {
  summary: BalanceHistorySummary;
  balances: MonthlyBalance[];
}

export abstract class BalanceHistoryRepository {
  abstract getProductBalances(productId: string, request: MonthlyBalanceRequest): Observable<BalanceHistoryResult>;
  abstract getAllBalances(request: MonthlyBalanceRequest): Observable<BalanceHistoryResult>;
}
