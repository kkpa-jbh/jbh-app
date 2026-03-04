import { Observable } from 'rxjs';
import { Category, CategorySource } from '../features/categories';

export abstract class CategoryRepository {
  abstract findBySource(source: CategorySource): Observable<Category[]>;
  abstract getIncomeCategories(): Observable<Category[]>;
  abstract getExpenseCategories(): Observable<Category[]>;
}
