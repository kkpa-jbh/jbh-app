/**
 * Domain Model for the result of a bank statement import
 *
 * Mapping Flow: API Response → Domain Model
 */

import { StatementClassificationResponse } from '../api/responses/statement-classification.response';
import { TotalsCheckStatus } from '../types/statement.types';
import { CategorizedMovement } from './categorized-movement.model';

export class StatementClassification {
  constructor(
    public readonly movements: CategorizedMovement[],
    public readonly totalsCheckStatus: TotalsCheckStatus,
    public readonly expectedBalanceChange: number | null,
    public readonly movementsBalanceChange: number,
  ) {}

  get hasTotalsMismatch(): boolean {
    return this.totalsCheckStatus === 'MISMATCH';
  }

  get totalsNotAvailable(): boolean {
    return this.totalsCheckStatus === 'NOT_AVAILABLE';
  }

  static fromApiResponse(response: StatementClassificationResponse): StatementClassification {
    return new StatementClassification(
      response.movements.map(m => CategorizedMovement.fromApiResponse(m)),
      response.totalsCheckStatus,
      response.expectedBalanceChange,
      response.movementsBalanceChange
    );
  }
}
