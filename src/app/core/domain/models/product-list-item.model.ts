export interface ProductListItemApiResponse {
  id: string;
  name: string;
  isActive: boolean;
}

export class ProductListItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly isActive: boolean
  ) {}

  static fromApiResponse(response: ProductListItemApiResponse): ProductListItem {
    return new ProductListItem(
      response.id,
      response.name,
      response.isActive
    );
  }
}
