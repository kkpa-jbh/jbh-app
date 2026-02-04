export interface CategoryApiResponse {
  id: { value: string };
  name: string;
  displayNameEn: string;
  displayNameEs: string;
  type: 'INCOME' | 'EXPENSE';
}

export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly displayNameEn: string,
    public readonly displayNameEs: string,
    public readonly type: 'INCOME' | 'EXPENSE'
  ) {}

  static fromApiResponse(response: CategoryApiResponse): Category {
    return new Category(
      response.id.value,
      response.name,
      response.displayNameEn,
      response.displayNameEs,
      response.type
    );
  }

  getLocalizedName(language: string): string {
    return language === 'es' ? this.displayNameEs : this.displayNameEn;
  }
}
