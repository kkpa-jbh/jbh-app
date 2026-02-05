import { Observable } from 'rxjs';
import { ProductType } from '../models/product-type.model';
import { ProductMetadataConfig } from '../models/product-metadata-config.model';
import { CreateProductRequest, CreateProductResponse, UpdateProductRequest } from '../models/product.model';
import { ProductListItem } from '../models/product-list-item.model';
import { AddMovementRequest, AddMovementResponse } from '../models/movement.model';

export abstract class ProductRepository {
  abstract getProductTypes(): Observable<ProductType[]>;
  abstract getMetadataConfig(productType: string): Observable<ProductMetadataConfig[]>;
  abstract createProduct(request: CreateProductRequest): Observable<CreateProductResponse>;
  abstract getProducts(teamId?: string): Observable<ProductListItem[]>;
  abstract getProductById(id: string, teamId?: string): Observable<ProductListItem>;
  abstract updateProduct(id: string, request: UpdateProductRequest): Observable<void>;
  abstract deleteProduct(id: string): Observable<void>;
  abstract updateProductStatus(id: string, active: boolean): Observable<void>;
  abstract addMovement(productId: string, request: AddMovementRequest): Observable<AddMovementResponse>;
}
