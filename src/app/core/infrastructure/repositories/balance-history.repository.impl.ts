import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { BalanceHistoryRepository } from '@core/domain/repositories/balance-history.repository';
import { MonthlyBalanceRequest, BalanceHistoryModel } from '@core/domain/models/balance-history.model';
import { BalanceHistoryResponse } from '@core/domain/models/balance-history-response.interface';
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

  getProductBalances(productId: string, request: MonthlyBalanceRequest): Observable<BalanceHistoryModel> {
    return this.post<BalanceHistoryResponse>(`${this.ENDPOINT}/${productId}`, request).pipe(
      map(response => BalanceHistoryModel.fromResponse(response))
    );
  }

  getAllBalances(request: MonthlyBalanceRequest): Observable<BalanceHistoryModel> {
    return this.post<BalanceHistoryResponse>(`${this.ENDPOINT}/`, request).pipe(
      map(response => BalanceHistoryModel.fromResponse(response))
    );
  }
}
