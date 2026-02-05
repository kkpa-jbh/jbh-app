export class PreferencesId {
  constructor(public readonly value: string) {}

  toString(): string {
    return this.value;
  }

  equals(other: PreferencesId): boolean {
    return this.value === other.value;
  }
}

export enum Language {
  EN = 'EN',
  ES = 'ES'
}

export enum Currency {
  COP = 'COP',
  USD = 'USD'
}

export interface PreferencesApiResponse {
  id: { value: string };
  defaultLang: { code: string };
  defaultCurrency: string;
  savingsGoal: number;
  defaultAccountId: string | null;
}

export interface UpdatePreferencesDto {
  defaultLang: Language;
  defaultCurrency: Currency;
  savingsGoal: number;
  defaultProductId: string | null;
}

export interface UpdatePreferencesApiRequest {
  defaultLang: string;
  defaultCurrency: string;
  savingsGoal: number;
  defaultAccountId: string | null;
}

export function toApiRequest(dto: UpdatePreferencesDto): UpdatePreferencesApiRequest {
  return {
    defaultLang: dto.defaultLang.toLowerCase(),
    defaultCurrency: dto.defaultCurrency,
    savingsGoal: dto.savingsGoal,
    defaultAccountId: dto.defaultProductId
  };
}

export class Preferences {
  constructor(
    public readonly defaultLang: Language,
    public readonly defaultCurrency: Currency,
    public readonly savingsGoal: number,
    public readonly defaultProductId: string | null
  ) {}

  static fromApiResponse(response: PreferencesApiResponse): Preferences {
    const langCode = response.defaultLang.code.toUpperCase() as Language;
    return new Preferences(
      langCode,
      response.defaultCurrency as Currency,
      response.savingsGoal,
      response.defaultAccountId
    );
  }
}
