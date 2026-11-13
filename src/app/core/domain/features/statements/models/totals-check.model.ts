/**
 * Domain Model for the totals check of one currency in a statement import
 *
 * Mapping Flow: API Response → Domain Model
 */

import { TotalsCheckResponse } from '../api/responses/totals-check.response';
import { TotalsCheckStatus } from '../types/statement.types';

export class TotalsCheck {
  constructor(
    public readonly currency: string,
    public readonly status: TotalsCheckStatus,
    public readonly expectedChange: number | null,
    public readonly movementsChange: number,
  ) {}

  get isMismatch(): boolean {
    return this.status === 'MISMATCH';
  }

  get isNotAvailable(): boolean {
    return this.status === 'NOT_AVAILABLE';
  }

  static fromApiResponse(response: TotalsCheckResponse): TotalsCheck {
    return new TotalsCheck(
      response.currency,
      response.status,
      response.expectedChange,
      response.movementsChange
    );
  }
}
