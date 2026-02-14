import { MetadataFieldConfigResponse } from '../api/responses/product-metadata-config-api.response';

export enum MetadataValueType {
  STRING = 'STRING',
  INT = 'INT',
  BIGDECIMAL = 'BIGDECIMAL',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN'
}

export interface MetadataTranslation {
  en: string;
  es: string;
}

export class ProductMetadataConfig {
  constructor(
    public readonly key: string,
    public readonly valueType: MetadataValueType,
    public readonly required: boolean,
    public readonly minValue: number | null,
    public readonly maxValue: number | null,
    public readonly translations: MetadataTranslation
  ) {}

  getLocalizedDisplayName(language: string): string {
    return this.translations[language as keyof MetadataTranslation] || this.translations.en;
  }

  static fromApiResponse(response: MetadataFieldConfigResponse): ProductMetadataConfig {
    const translations = JSON.parse(response.displayName) as MetadataTranslation;
    const valueType = response.valueType as MetadataValueType;

    return new ProductMetadataConfig(
      response.key,
      valueType,
      response.required,
      response.minValue !== null ? parseFloat(response.minValue) : null,
      response.maxValue !== null ? parseFloat(response.maxValue) : null,
      translations
    );
  }
}
