export interface CreateProductRequest {
  name: string;
  type: string;
  metadata: Record<string, any>;
}

export interface CreateProductResponse {
  id: string;
  name: string;
  type: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface UpdateProductRequest {
  name: string;
  metadata: Record<string, any>;
}
