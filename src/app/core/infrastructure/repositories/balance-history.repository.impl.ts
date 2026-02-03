import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { BalanceHistoryRepository, BalanceHistoryResult } from '@core/domain/repositories/balance-history.repository';
import { MonthlyBalance, BalanceHistoryResponseApi, MonthlyBalanceRequest } from '@core/domain/models/monthly-balance.model';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

@Injectable({
  providedIn: 'root'
})
export class BalanceHistoryRepositoryImpl extends ApiBaseService implements BalanceHistoryRepository {

  private readonly ENDPOINT = '/finance/products/monthly-balances';

  constructor(http: HttpClient, envConfig: EnvironmentConfig, logger: LoggerService) {
    super(http, envConfig, logger);
  }

  getProductBalances(productId: string, request: MonthlyBalanceRequest): Observable<BalanceHistoryResult> {
    return this.post<BalanceHistoryResponseApi>(`${this.ENDPOINT}/${productId}`, request).pipe(
      map(response => ({
        summary: response.summary,
        balances: response.balances.map(b => MonthlyBalance.fromApiResponse(b))
      }))
    );
  }

  getAllBalances(request: MonthlyBalanceRequest): Observable<BalanceHistoryResult> {
    return this.post<BalanceHistoryResponseApi>(`${this.ENDPOINT}/`, request).pipe(
      map(response => ({
        summary: response.summary,
        balances: response.balances.map(b => MonthlyBalance.fromApiResponse(b))
      }))
    );
  }
}
