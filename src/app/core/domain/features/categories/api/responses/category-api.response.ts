/**
 * API Response Interface (HTTP Boundary)
 *
 * This interface MUST exactly match the backend CategoryResponse object.
 * DO NOT modify to fit UI needs - create Models for that purpose.
 */

export interface CategoryApiResponse {
  id: number;
  source: CategorySource;
  alias: string;
  active: boolean;
  displayName: Record<string, string>;
}

export type CategorySource = 'INCOME' | 'EXPENSE';
