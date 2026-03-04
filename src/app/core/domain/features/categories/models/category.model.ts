/**
 * Domain Model for Category
 *
 * Represents application-level data and is independent from the API shape.
 *
 * Mapping Flow: API Response → Domain Model
 */

import { CategoryApiResponse, CategorySource } from '../api/responses/category-api.response';

export class Category {
  constructor(
    public readonly id: number,
    public readonly source: CategorySource,
    public readonly alias: string,
    public readonly active: boolean,
    public readonly displayName: Record<string, string>
  ) {}

  static fromApiResponse(response: CategoryApiResponse): Category {
    return new Category(
      response.id,
      response.source,
      response.alias,
      response.active,
      response.displayName
    );
  }
}
