/**
 * Domain Model for Preferences
 *
 * Represents application-level data and is independent from the API shape.
 * Includes computed properties and helper methods as needed for business logic.
 *
 * Mapping Flow: API Response → Domain Model
 */

import { UserPreferencesResponse } from '../api/responses/preferences-api.response';
import { Language, Currency } from '../types/preferences.types';

export class Preferences {
  constructor(
    public readonly defaultLang: Language,
    public readonly defaultCurrency: Currency,
    public readonly savingsGoal: number,
    public readonly defaultProductId: string | null
  ) {}

  static fromApiResponse(response: UserPreferencesResponse): Preferences {
    const langCode = response.defaultLang.code.toUpperCase() as Language;
    return new Preferences(
      langCode,
      response.defaultCurrency as Currency,
      response.savingsGoal,
      response.defaultProductId
    );
  }
}
