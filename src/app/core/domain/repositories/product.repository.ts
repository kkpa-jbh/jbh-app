import { Observable } from 'rxjs';
import {
  ProductType,
  ProductMetadataConfig,
  AddTransferRequest,
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
  ProductListItem
} from '../features/products';
import {
  AddMovementRequest,
  AddMovementApiResponse,
  ProductMovement
} from '../features/movements';

export abstract class ProductRepository {
  abstract getProductTypes(): Observable<ProductType[]>;
  abstract getMetadataConfig(productType: string): Observable<ProductMetadataConfig[]>;
  abstract createProduct(request: CreateProductRequest): Observable<ProductResponse>;
  abstract getProducts(teamId?: string): Observable<ProductListItem[]>;
  abstract getProductById(id: string, teamId?: string): Observable<ProductListItem>;
  abstract updateProduct(id: string, request: UpdateProductRequest): Observable<void>;
  abstract deleteProduct(id: string): Observable<void>;
  abstract updateProductStatus(id: string, active: boolean): Observable<void>;
  abstract addMovement(productId: string, request: AddMovementRequest): Observable<AddMovementApiResponse>;
  abstract getProductMovements(productId: string): Observable<ProductMovement[]>;
  abstract deleteProductMovement(productId: string, movementId: string): Observable<void>;
  abstract executeTransfer(fromAccountId: string, request: AddTransferRequest): Observable<void>;
}
