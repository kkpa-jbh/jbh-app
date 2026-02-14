/**
 * Domain Model for Category
 *
 * Represents application-level data and is independent from the API shape.
 * Includes computed properties and helper methods as needed for business logic.
 *
 * Mapping Flow: API Response → Domain Model
 */

import { CategoryResponse, CategorySource } from '../api/responses/category-api.response';

export class Category {
  constructor(
    public readonly name: string,
    public readonly translationKey: string,
    public readonly source: CategorySource
  ) {}

  static fromApiResponse(response: CategoryResponse): Category {
    return new Category(
      response.name,
      response.translationKey,
      response.source
    );
  }
}
