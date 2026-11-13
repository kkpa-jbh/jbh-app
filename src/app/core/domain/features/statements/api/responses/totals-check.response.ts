/**
 * API Response Interface (HTTP Boundary)
 *
 * This interface MUST exactly match the backend TotalsCheckResponse object.
 * DO NOT modify to fit UI needs - create Models for that purpose.
 */

import { TotalsCheckStatus } from '../../types/statement.types';

export interface TotalsCheckResponse {
  currency: string;
  status: TotalsCheckStatus;
  expectedChange: number | null;
  movementsChange: number;
}
