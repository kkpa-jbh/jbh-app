import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, shareReplay, tap } from 'rxjs';
import { ProductRepository } from '../repositories/product.repository';
import { ProductType } from '../models/product-type.model';
import { ProductMetadataConfig } from '../models/product-metadata-config.model';
import { CreateProductRequest, CreateProductResponse, UpdateProductRequest } from '../models/product.model';
import { ProductListItem } from '../models/product-list-item.model';

@Injectable({
  providedIn: 'root'
})
export class ProductUseCase {

  private productTypes$: Observable<ProductType[]> | null = null;
  private products$: Observable<ProductListItem[]> | null = null;
  private metadataConfigCache = new Map<string, Observable<ProductMetadataConfig[]>>();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private productsLoadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  public productsLoading$ = this.productsLoadingSubject.asObservable();

  constructor(private productRepository: ProductRepository) {}

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

  createProduct(request: CreateProductRequest): Observable<CreateProductResponse> {
    return this.productRepository.createProduct(request).pipe(
      tap(() => this.clearProductsCache())
    );
  }

  getProducts(): Observable<ProductListItem[]> {
    if (!this.products$) {
      this.productsLoadingSubject.next(true);
      this.products$ = this.productRepository.getProducts().pipe(
        tap(() => this.productsLoadingSubject.next(false)),
        shareReplay(1)
      );
    }
    return this.products$;
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

  clearProductsCache(): void {
    this.products$ = null;
  }

  clearCache(): void {
    this.productTypes$ = null;
    this.metadataConfigCache.clear();
    this.products$ = null;
  }
}
