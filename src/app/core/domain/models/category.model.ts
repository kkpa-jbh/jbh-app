export type CategorySource = 'INCOME' | 'EXPENSE';

export interface CategoryApiResponse {
  name: string;
  translationKey: string;
  source: CategorySource;
}

export class Category {
  constructor(
    public readonly name: string,
    public readonly translationKey: string,
    public readonly source: CategorySource
  ) {}

  static fromApiResponse(response: CategoryApiResponse): Category {
    return new Category(
      response.name,
      response.translationKey,
      response.source
    );
  }
}
