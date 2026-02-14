import { Observable } from 'rxjs';
import { Category } from '../features/categories';

export abstract class CategoryRepository {
  abstract getIncomeCategories(): Observable<Category[]>;
  abstract getExpenseCategories(): Observable<Category[]>;
}
