export interface ProductTypeTranslation {
  en: string;
  es: string;
}

export interface ProductTypeApiResponse {
  name: string;
  translationKey: string;
}

export class ProductType {
  constructor(
    public readonly name: string,
    public readonly translations: ProductTypeTranslation
  ) {}

  getLocalizedName(language: string): string {
    return this.translations[language as keyof ProductTypeTranslation] || this.translations.en;
  }

  static fromApiResponse(response: ProductTypeApiResponse): ProductType {
    const translations = JSON.parse(response.translationKey) as ProductTypeTranslation;
    return new ProductType(response.name, translations);
  }
}
