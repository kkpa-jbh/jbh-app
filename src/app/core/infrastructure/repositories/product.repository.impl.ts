import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductRepository } from '@core/domain/repositories/product.repository';
import {
  ProductType,
  ProductTypeApiResponse,
  ProductMetadataConfig,
  ProductMetadataConfigApiResponse,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  ProductListItem,
  ProductListItemApiResponse
} from '@core/domain/features/products';
import {
  AddMovementRequest,
  AddMovementResponse,
  ProductMovement,
  ProductMovementApiResponse
} from '@core/domain/features/movements';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';
import { HttpClient } from '@angular/common/http';
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

@Injectable({
  providedIn: 'root'
})
export class ProductRepositoryImpl extends ApiBaseService implements ProductRepository {

  private readonly PRODUCTS_ENDPOINT = '/finance/products';
  private readonly PRODUCT_TYPES_ENDPOINT = '/finance/product-types';
  private readonly METADATA_CONFIG_ENDPOINT = '/finance/products/metadata-config';

  constructor(http: HttpClient, envConfig: EnvironmentConfig, logger: LoggerService) {
    super(http, envConfig, logger);
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

  getProducts(teamId?: string): Observable<ProductListItem[]> {
    const options = teamId ? { params: { teamId } } : {};
    return this.get<ProductListItemApiResponse[]>(
      this.PRODUCTS_ENDPOINT,
      options
    ).pipe(
      map(responses => responses.map(response => ProductListItem.fromApiResponse(response)))
    );
  }

  getProductById(id: string, teamId?: string): Observable<ProductListItem> {
    const options = teamId ? { params: { teamId } } : {};
    return this.get<ProductListItemApiResponse>(
      `${this.PRODUCTS_ENDPOINT}/${id}`,
      options
    ).pipe(
      map(response => ProductListItem.fromApiResponse(response))
    );
  }

  updateProduct(id: string, request: UpdateProductRequest): Observable<void> {
    return this.put<void>(`${this.PRODUCTS_ENDPOINT}/${id}`, request);
  }

  deleteProduct(id: string): Observable<void> {
    return this.delete<void>(`${this.PRODUCTS_ENDPOINT}/${id}`);
  }

  updateProductStatus(id: string, active: boolean): Observable<void> {
    return this.patch<void>(`${this.PRODUCTS_ENDPOINT}/${id}/status`, { active });
  }

  addMovement(productId: string, request: AddMovementRequest): Observable<AddMovementResponse> {
    return this.post<AddMovementResponse>(`${this.PRODUCTS_ENDPOINT}/movements/${productId}`, request);
  }

  getProductMovements(productId: string): Observable<ProductMovement[]> {
    return this.get<ProductMovementApiResponse[]>(`${this.PRODUCTS_ENDPOINT}/movements/${productId}`).pipe(
      map(responses => responses.map(response => ProductMovement.fromApiResponse(response)))
    );
  }

  deleteProductMovement(productId: string, movementId: string): Observable<void> {
    return this.delete<void>(`${this.PRODUCTS_ENDPOINT}/movements/${productId}/${movementId}`);
  }
}
