import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductRepository } from '@core/domain/repositories/product.repository';
import { ProductType, ProductTypeApiResponse } from '@core/domain/models/product-type.model';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';
import { HttpClient } from '@angular/common/http';
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';

@Injectable({
  providedIn: 'root'
})
export class ProductRepositoryImpl extends ApiBaseService implements ProductRepository {

  private readonly PRODUCT_TYPES_ENDPOINT = '/finance/product-types';

  constructor(http: HttpClient, envConfig: EnvironmentConfig) {
    super(http, envConfig);
  }

  getProductTypes(): Observable<ProductType[]> {
    return this.get<ProductTypeApiResponse[]>(this.PRODUCT_TYPES_ENDPOINT).pipe(
      map(responses => responses.map(response => ProductType.fromApiResponse(response)))
    );
  }
}
