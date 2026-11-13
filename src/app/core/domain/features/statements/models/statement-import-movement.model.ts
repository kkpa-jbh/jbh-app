/**
 * Domain Model for a movement saved by a statement import, with its category
 *
 * Mapping Flow: API Response → Domain Model
 */

import { StatementImportMovementResponse } from '../api/responses/statement-import-movement.response';
import { StatementMovementDirection } from '../types/statement.types';

export class StatementImportMovement {
  constructor(
    public readonly movementId: string,
    public readonly date: string,
    public readonly description: string,
    public readonly amount: number,
    public readonly direction: StatementMovementDirection,
    public readonly categoryAlias: string,
    public readonly categoryDisplayName: Record<string, string>,
    public readonly confidence: number,
    public readonly needsReview: boolean,
  ) {}

  static fromApiResponse(response: StatementImportMovementResponse): StatementImportMovement {
    return new StatementImportMovement(
      response.movementId,
      response.date,
      response.description,
      response.amount,
      response.direction,
      response.category.alias,
      response.category.displayName,
      response.confidence,
      response.needsReview
    );
  }
}
