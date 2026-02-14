import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryRepository } from '@core/domain/repositories/category.repository';
import { Category, CategoryApiResponse } from '@core/domain/features/categories';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';
import { HttpClient } from '@angular/common/http';
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryRepositoryImpl extends ApiBaseService implements CategoryRepository {

  private readonly CATEGORIES_ENDPOINT = '/finance/categories';

  constructor(http: HttpClient, envConfig: EnvironmentConfig, logger: LoggerService) {
    super(http, envConfig, logger);
  }

  getIncomeCategories(): Observable<Category[]> {
    return this.get<CategoryApiResponse[]>(`${this.CATEGORIES_ENDPOINT}/incomes`).pipe(
      map(responses => responses.map(response => Category.fromApiResponse(response)))
    );
  }

  getExpenseCategories(): Observable<Category[]> {
    return this.get<CategoryApiResponse[]>(`${this.CATEGORIES_ENDPOINT}/expenses`).pipe(
      map(responses => responses.map(response => Category.fromApiResponse(response)))
    );
  }
}
