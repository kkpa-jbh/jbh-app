import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { CategoryRepository } from '../repositories/category.repository';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryUseCase {

  private incomeCategories$: Observable<Category[]> | null = null;
  private expenseCategories$: Observable<Category[]> | null = null;

  constructor(private categoryRepository: CategoryRepository) {}

  getIncomeCategories(): Observable<Category[]> {
    if (!this.incomeCategories$) {
      this.incomeCategories$ = this.categoryRepository.getIncomeCategories().pipe(
        shareReplay(1)
      );
    }
    return this.incomeCategories$;
  }

  getExpenseCategories(): Observable<Category[]> {
    if (!this.expenseCategories$) {
      this.expenseCategories$ = this.categoryRepository.getExpenseCategories().pipe(
        shareReplay(1)
      );
    }
    return this.expenseCategories$;
  }

  clearCache(): void {
    this.incomeCategories$ = null;
    this.expenseCategories$ = null;
  }
}
