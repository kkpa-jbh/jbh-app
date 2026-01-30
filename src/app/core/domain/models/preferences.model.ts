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
  id: string;
  defaultLang: string;
  defaultCurrency: string;
  savingsGoal: number;
  defaultProductId: string | null;
}

export interface UpdatePreferencesRequest {
  defaultLang: Language;
  defaultCurrency: Currency;
  savingsGoal: number;
  defaultProductId: string | null;
}

export class Preferences {
  constructor(
    public readonly id: PreferencesId,
    public readonly defaultLang: Language,
    public readonly defaultCurrency: Currency,
    public readonly savingsGoal: number,
    public readonly defaultProductId: string | null
  ) {}

  static fromApiResponse(response: PreferencesApiResponse): Preferences {
    return new Preferences(
      new PreferencesId(response.id),
      response.defaultLang as Language,
      response.defaultCurrency as Currency,
      response.savingsGoal,
      response.defaultProductId
    );
  }
}
