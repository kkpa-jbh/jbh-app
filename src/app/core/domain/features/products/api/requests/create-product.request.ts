export interface CreateProductRequest {
  name: string;
  type: string;
  metadata: Record<string, any>;
}
