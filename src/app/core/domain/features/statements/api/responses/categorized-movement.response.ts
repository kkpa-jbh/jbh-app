/**
 * API Response Interface (HTTP Boundary)
 *
 * This interface MUST exactly match the backend CategorizedMovementResponse object.
 * DO NOT modify to fit UI needs - create Models for that purpose.
 */

import { StatementMovementDirection } from '../../types/statement.types';

export interface CategorizedMovementResponse {
  date: string;
  description: string;
  amount: number;
  direction: StatementMovementDirection;
  categoryAlias: string;
  categoryDisplayName: Record<string, string>;
  confidence: number;
  lowConfidence: boolean;
}
