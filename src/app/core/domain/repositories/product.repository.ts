import { Observable } from 'rxjs';
import { ProductType } from '../models/product-type.model';
import { ProductMetadataConfig } from '../models/product-metadata-config.model';
import { CreateProductRequest, CreateProductResponse } from '../models/product.model';

export abstract class ProductRepository {
  abstract getProductTypes(): Observable<ProductType[]>;
  abstract getMetadataConfig(productType: string): Observable<ProductMetadataConfig[]>;
  abstract createProduct(request: CreateProductRequest): Observable<CreateProductResponse>;
}
