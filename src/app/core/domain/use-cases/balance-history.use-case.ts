import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, shareReplay, tap } from 'rxjs';
import { BalanceHistoryRepository } from '../repositories/balance-history.repository';
import { MonthlyBalanceRequest, BalanceHistoryModel } from '../features/balance-history';

@Injectable({
  providedIn: 'root'
})
export class BalanceHistoryUseCase {

  private balanceCache = new Map<string, Observable<BalanceHistoryModel>>();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private balanceHistoryRepository: BalanceHistoryRepository) {}

  getProductBalances(productId: string, request: MonthlyBalanceRequest): Observable<BalanceHistoryModel> {
    const cacheKey = `product-${productId}-${request.startPeriod}-${request.endPeriod}`;

    if (!this.balanceCache.has(cacheKey)) {
      this.loadingSubject.next(true);
      const result$ = this.balanceHistoryRepository.getProductBalances(productId, request).pipe(
        tap(() => this.loadingSubject.next(false)),
        shareReplay(1)
      );
      this.balanceCache.set(cacheKey, result$);
    }
    return this.balanceCache.get(cacheKey)!;
  }

  getAllBalances(request: MonthlyBalanceRequest): Observable<BalanceHistoryModel> {
    const cacheKey = `all-${request.startPeriod}-${request.endPeriod}`;

    if (!this.balanceCache.has(cacheKey)) {
      this.loadingSubject.next(true);
      const result$ = this.balanceHistoryRepository.getAllBalances(request).pipe(
        tap(() => this.loadingSubject.next(false)),
        shareReplay(1)
      );
      this.balanceCache.set(cacheKey, result$);
    }
    return this.balanceCache.get(cacheKey)!;
  }

  refreshProductBalances(productId: string, request: MonthlyBalanceRequest): Observable<BalanceHistoryModel> {
    const cacheKey = `product-${productId}-${request.startPeriod}-${request.endPeriod}`;
    this.balanceCache.delete(cacheKey);
    return this.getProductBalances(productId, request);
  }

  refreshAllBalances(request: MonthlyBalanceRequest): Observable<BalanceHistoryModel> {
    const cacheKey = `all-${request.startPeriod}-${request.endPeriod}`;
    this.balanceCache.delete(cacheKey);
    return this.getAllBalances(request);
  }

  clearCache(): void {
    this.balanceCache.clear();
  }
}
