import { Observable } from 'rxjs';
import { Category } from '../models/category.model';

export abstract class CategoryRepository {
  abstract getIncomeCategories(): Observable<Category[]>;
  abstract getExpenseCategories(): Observable<Category[]>;
}
