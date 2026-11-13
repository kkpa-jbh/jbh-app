/**
 * Domain Model for the summary of a finished statement import
 *
 * Mapping Flow: API Response → Domain Model
 */

import { StatementImportSummaryResponse } from '../api/responses/statement-import-summary.response';
import { SkippedStatementMovement } from './skipped-statement-movement.model';
import { TotalsCheck } from './totals-check.model';

export class StatementImportSummary {
  constructor(
    public readonly mainCurrency: string,
    public readonly savedCount: number,
    public readonly skippedCount: number,
    public readonly needsReviewCount: number,
    public readonly totalsChecks: TotalsCheck[],
    public readonly notSavedMovements: SkippedStatementMovement[],
  ) {}

  static fromApiResponse(response: StatementImportSummaryResponse): StatementImportSummary {
    return new StatementImportSummary(
      response.mainCurrency,
      response.savedCount,
      response.skippedCount,
      response.needsReviewCount,
      response.totalsChecks.map(check => TotalsCheck.fromApiResponse(check)),
      response.notSavedMovements.map(movement => SkippedStatementMovement.fromApiResponse(movement))
    );
  }
}
