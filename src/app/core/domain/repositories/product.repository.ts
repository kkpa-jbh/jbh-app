import { Observable } from 'rxjs';
import { ProductType } from '../models/product-type.model';

export abstract class ProductRepository {
  abstract getProductTypes(): Observable<ProductType[]>;
}
