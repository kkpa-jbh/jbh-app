/**
 * API Request Interfaces
 *
 * Request payloads for updating preferences.
 */

import { Language, Currency } from '../../types/preferences.types';

/**
 * Domain DTO for updating preferences.
 * Used within the application layer.
 */
export interface UpdatePreferencesDto {
  defaultLang: Language;
  defaultCurrency: Currency;
  savingsGoal: number;
  defaultProductId: string | null;
}

/**
 * API request payload for updating preferences.
 * Sent to the backend API.
 */
export interface UpdatePreferencesApiRequest {
  defaultLang: string;
  defaultCurrency: string;
  savingsGoal: number;
  defaultProductId: string | null;
}

/**
 * Converts domain DTO to API request format.
 * Transforms enum values to lowercase strings as expected by the backend.
 */
export function toApiRequest(dto: UpdatePreferencesDto): UpdatePreferencesApiRequest {
  return {
    defaultLang: dto.defaultLang.toLowerCase(),
    defaultCurrency: dto.defaultCurrency,
    savingsGoal: dto.savingsGoal,
    defaultProductId: dto.defaultProductId
  };
}
