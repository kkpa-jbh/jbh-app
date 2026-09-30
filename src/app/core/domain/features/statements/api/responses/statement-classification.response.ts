/**
 * API Response Interface (HTTP Boundary)
 *
 * This interface MUST exactly match the backend StatementClassificationResponse object.
 * DO NOT modify to fit UI needs - create Models for that purpose.
 */

import { TotalsCheckStatus } from '../../types/statement.types';
import { CategorizedMovementResponse } from './categorized-movement.response';

export interface StatementClassificationResponse {
  movements: CategorizedMovementResponse[];
  totalsCheckStatus: TotalsCheckStatus;
  expectedBalanceChange: number | null;
  movementsBalanceChange: number;
}
