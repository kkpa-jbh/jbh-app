/**
 * API Response Interface (HTTP Boundary)
 *
 * This interface MUST exactly match the backend SkippedStatementMovementResponse object.
 * DO NOT modify to fit UI needs - create Models for that purpose.
 */

import { StatementMovementDirection, StatementSkipReason } from '../../types/statement.types';

export interface SkippedStatementMovementResponse {
  date: string;
  description: string;
  amount: number;
  currency: string;
  direction: StatementMovementDirection;
  reason: StatementSkipReason;
  categoryAlias: string;
  categoryDisplayName: Record<string, string>;
  confidence: number;
  needsReview: boolean;
}
