import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, shareReplay, tap } from 'rxjs';
import { ProductRepository } from '../repositories/product.repository';
import {
  ProductType,
  ProductMetadataConfig,
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
  ProductListItem,
  ProductTypeResponse
} from '../features/products';
import { AddMovementRequest, AddMovementResponse } from '../features/movements';
import { PortfolioContextService } from '@core/infrastructure/context/portfolio-context.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

@Injectable({
  providedIn: 'root'
})
export class ProductUseCase {

  private productTypes$: Observable<ProductType[]> | null = null;
  private productsCacheMap = new Map<string, Observable<ProductListItem[]>>();
  private metadataConfigCache = new Map<string, Observable<ProductMetadataConfig[]>>();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private productsLoadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  public productsLoading$ = this.productsLoadingSubject.asObservable();

  constructor(
    private productRepository: ProductRepository,
    private portfolioContext: PortfolioContextService,
    private logger: LoggerService
  ) {}

  getProductTypes(): Observable<ProductType[]> {
    if (!this.productTypes$) {
      this.loadingSubject.next(true);
      this.productTypes$ = this.productRepository.getProductTypes().pipe(
        tap(() => this.loadingSubject.next(false)),
        shareReplay(1)
      );
    }
    return this.productTypes$;
  }

  getMetadataConfig(productType: string): Observable<ProductMetadataConfig[]> {
    if (!this.metadataConfigCache.has(productType)) {
      const config$ = this.productRepository.getMetadataConfig(productType).pipe(
        shareReplay(1)
      );
      this.metadataConfigCache.set(productType, config$);
    }
    return this.metadataConfigCache.get(productType)!;
  }

  createProduct(request: CreateProductRequest): Observable<ProductResponse> {
    return this.productRepository.createProduct(request).pipe(
      tap(() => this.clearProductsCache())
    );
  }

  getProducts(): Observable<ProductListItem[]> {
    const context = this.portfolioContext.getCurrentContext();
    const cacheKey = context.isPersonal ? 'personal' : `team_${context.teamId}`;

    if (!this.productsCacheMap.has(cacheKey)) {
      this.productsLoadingSubject.next(true);
      const products$ = this.productRepository
        .getProducts(context.teamId || undefined)
        .pipe(
          tap(() => this.productsLoadingSubject.next(false)),
          tap(products => this.logger.info('Products loaded', 'ProductUseCase', {
            count: products.length,
            context: context.type,
            teamId: context.teamId
          })),
          shareReplay(1)
        );
      this.productsCacheMap.set(cacheKey, products$);
    }
    return this.productsCacheMap.get(cacheKey)!;
  }

  refreshProducts(): Observable<ProductListItem[]> {
    this.clearProductsCache();
    return this.getProducts();
  }

  getProductById(id: string): Observable<ProductListItem> {
    return this.productRepository.getProductById(id);
  }

  updateProduct(id: string, request: UpdateProductRequest): Observable<void> {
    return this.productRepository.updateProduct(id, request).pipe(
      tap(() => this.clearProductsCache())
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this.productRepository.deleteProduct(id).pipe(
      tap(() => this.clearProductsCache())
    );
  }

  updateProductStatus(id: string, active: boolean): Observable<void> {
    return this.productRepository.updateProductStatus(id, active).pipe(
      tap(() => this.clearProductsCache())
    );
  }

  addMovement(productId: string, request: AddMovementRequest): Observable<AddMovementResponse> {
    return this.productRepository.addMovement(productId, request).pipe(
      tap(() => this.clearProductsCache())
    );
  }

  clearProductsCache(): void {
    this.productsCacheMap.clear();
    this.logger.info('Products cache cleared', 'ProductUseCase');
  }

  clearCache(): void {
    this.productTypes$ = null;
    this.metadataConfigCache.clear();
    this.productsCacheMap.clear();
  }
}
