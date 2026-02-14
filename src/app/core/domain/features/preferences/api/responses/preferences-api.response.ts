/**
 * API Response Interface (HTTP Boundary)
 *
 * This interface MUST exactly match the backend PreferencesResponse object.
 * DO NOT modify to fit UI needs - create Models for that purpose.
 */

export interface UserPreferencesResponse {
  id: { value: string };
  defaultLang: { code: string };
  defaultCurrency: string;
  savingsGoal: number;
  defaultProductId: string | null;
}
