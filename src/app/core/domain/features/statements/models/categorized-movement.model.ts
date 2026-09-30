/**
 * Domain Model for a statement movement with its suggested category
 *
 * Mapping Flow: API Response → Domain Model
 */

import { CategorizedMovementResponse } from '../api/responses/categorized-movement.response';
import { StatementMovementDirection } from '../types/statement.types';

export class CategorizedMovement {
  constructor(
    public readonly date: string,
    public readonly description: string,
    public readonly amount: number,
    public readonly direction: StatementMovementDirection,
    public readonly categoryAlias: string,
    public readonly categoryDisplayName: Record<string, string>,
    public readonly confidence: number,
    public readonly lowConfidence: boolean,
  ) {}

  static fromApiResponse(response: CategorizedMovementResponse): CategorizedMovement {
    return new CategorizedMovement(
      response.date,
      response.description,
      response.amount,
      response.direction,
      response.categoryAlias,
      response.categoryDisplayName,
      response.confidence,
      response.lowConfidence
    );
  }
}
