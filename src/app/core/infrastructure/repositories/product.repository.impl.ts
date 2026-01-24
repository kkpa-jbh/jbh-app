import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductRepository } from '@core/domain/repositories/product.repository';
import { ProductType, ProductTypeApiResponse } from '@core/domain/models/product-type.model';
import { ProductMetadataConfig, ProductMetadataConfigApiResponse } from '@core/domain/models/product-metadata-config.model';
import { CreateProductRequest, CreateProductResponse } from '@core/domain/models/product.model';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';
import { HttpClient } from '@angular/common/http';
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';

@Injectable({
  providedIn: 'root'
})
export class ProductRepositoryImpl extends ApiBaseService implements ProductRepository {

  private readonly PRODUCTS_ENDPOINT = '/finance/products';
  private readonly PRODUCT_TYPES_ENDPOINT = '/finance/product-types';
  private readonly METADATA_CONFIG_ENDPOINT = '/finance/products/metadata-config';

  constructor(http: HttpClient, envConfig: EnvironmentConfig) {
    super(http, envConfig);
  }

  getProductTypes(): Observable<ProductType[]> {
    return this.get<ProductTypeApiResponse[]>(this.PRODUCT_TYPES_ENDPOINT).pipe(
      map(responses => responses.map(response => ProductType.fromApiResponse(response)))
    );
  }

  getMetadataConfig(productType: string): Observable<ProductMetadataConfig[]> {
    return this.get<ProductMetadataConfigApiResponse[]>(
      this.METADATA_CONFIG_ENDPOINT,
      { params: { productType } }
    ).pipe(
      map(responses => responses.map(response => ProductMetadataConfig.fromApiResponse(response)))
    );
  }

  createProduct(request: CreateProductRequest): Observable<CreateProductResponse> {
    return this.post<CreateProductResponse>(this.PRODUCTS_ENDPOINT, request);
  }
}
