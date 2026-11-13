/**
 * API Response Interface (HTTP Boundary)
 *
 * This interface MUST exactly match the backend StatementImportMovementResponse object.
 * DO NOT modify to fit UI needs - create Models for that purpose.
 */

import { StatementMovementDirection } from '../../types/statement.types';

export interface StatementImportMovementResponse {
  movementId: string;
  date: string;
  description: string;
  amount: number;
  direction: StatementMovementDirection;
  category: {
    alias: string;
    displayName: Record<string, string>;
  };
  confidence: number;
  needsReview: boolean;
}
