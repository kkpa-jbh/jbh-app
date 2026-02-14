/**
 * API Response Interface (HTTP Boundary)
 *
 * This interface MUST exactly match the backend CategoryResponse object.
 * DO NOT modify to fit UI needs - create Models for that purpose.
 */

export interface CategoryResponse {
  name: string;
  translationKey: string;
  source: CategorySource;
}

export type CategorySource = 'INCOME' | 'EXPENSE';
