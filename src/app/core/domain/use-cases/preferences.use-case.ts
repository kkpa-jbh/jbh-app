import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PreferencesRepository } from '../repositories/preferences.repository';
import { ProductRepository } from '../repositories/product.repository';
import { Preferences, UpdatePreferencesDto } from '../features/preferences';
import { ProductListItem } from '../features/products';

@Injectable({
  providedIn: 'root'
})
export class PreferencesUseCase {

  constructor(
    private preferencesRepository: PreferencesRepository,
    private productRepository: ProductRepository
  ) {}

  getPreferences(): Observable<Preferences> {
    return this.preferencesRepository.getPreferences();
  }

  updatePreferences(request: UpdatePreferencesDto): Observable<Preferences> {
    return this.preferencesRepository.updatePreferences(request);
  }

  getActiveProducts(): Observable<ProductListItem[]> {
    return this.productRepository.getProducts().pipe(
      map(products => products.filter(product => product.isActive))
    );
  }
}
