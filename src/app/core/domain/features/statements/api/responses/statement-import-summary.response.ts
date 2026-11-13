/**
 * API Response Interface (HTTP Boundary)
 *
 * This interface MUST exactly match the backend StatementImportSummaryResponse object.
 * DO NOT modify to fit UI needs - create Models for that purpose.
 */

import { SkippedStatementMovementResponse } from './skipped-statement-movement.response';
import { TotalsCheckResponse } from './totals-check.response';

export interface StatementImportSummaryResponse {
  mainCurrency: string;
  savedCount: number;
  skippedCount: number;
  needsReviewCount: number;
  totalsChecks: TotalsCheckResponse[];
  notSavedMovements: SkippedStatementMovementResponse[];
}
