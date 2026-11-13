/**
 * Domain Model for a statement movement that was not saved, with the reason
 *
 * Mapping Flow: API Response → Domain Model
 */

import { SkippedStatementMovementResponse } from '../api/responses/skipped-statement-movement.response';
import { StatementMovementDirection, StatementSkipReason } from '../types/statement.types';

export class SkippedStatementMovement {
  constructor(
    public readonly date: string,
    public readonly description: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly direction: StatementMovementDirection,
    public readonly reason: StatementSkipReason,
    public readonly categoryAlias: string,
    public readonly categoryDisplayName: Record<string, string>,
  ) {}

  static fromApiResponse(response: SkippedStatementMovementResponse): SkippedStatementMovement {
    return new SkippedStatementMovement(
      response.date,
      response.description,
      response.amount,
      response.currency,
      response.direction,
      response.reason,
      response.categoryAlias,
      response.categoryDisplayName
    );
  }
}
