import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, shareReplay, tap } from 'rxjs';
import { ProductRepository } from '../repositories/product.repository';
import { ProductType } from '../models/product-type.model';
import { ProductMetadataConfig } from '../models/product-metadata-config.model';
import { CreateProductRequest, CreateProductResponse } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductUseCase {

  private productTypes$: Observable<ProductType[]> | null = null;
  private metadataConfigCache = new Map<string, Observable<ProductMetadataConfig[]>>();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

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
    return this.productRepository.createProduct(request);
  }

  clearCache(): void {
    this.productTypes$ = null;
    this.metadataConfigCache.clear();
  }
}
