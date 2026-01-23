import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, shareReplay, tap } from 'rxjs';
import { ProductRepository } from '../repositories/product.repository';
import { ProductType } from '../models/product-type.model';

@Injectable({
  providedIn: 'root'
})
export class ProductUseCase {

  private productTypes$: Observable<ProductType[]> | null = null;
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

  clearCache(): void {
    this.productTypes$ = null;
  }
}
