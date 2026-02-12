import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductRepository } from '../repositories/product.repository';
import { ProductMovement } from '../models/product-movement.model';

@Injectable({
  providedIn: 'root'
})
export class ProductMovementUseCase {
  constructor(private productRepository: ProductRepository) {}

  getMovementsByProduct(productId: string): Observable<ProductMovement[]> {
    return this.productRepository.getProductMovements(productId);
  }

  deleteMovement(productId: string, movementId: string): Observable<void> {
    return this.productRepository.deleteProductMovement(productId, movementId);
  }
}
