/**
 * Domain Model for the state of a bank statement import
 *
 * Mapping Flow: API Response → Domain Model
 */

import { StatementImportResponse } from '../api/responses/statement-import.response';
import { StatementImportStatus } from '../types/statement.types';
import { StatementImportMovement } from './statement-import-movement.model';
import { StatementImportSummary } from './statement-import-summary.model';

/**
 * Backend error codes of a FAILED import that have their own message.
 * Any other code shows the generic message.
 */
const FAILURE_MESSAGE_KEYS: Readonly<Partial<Record<string, string>>> = {
  STATEMENT_NO_MOVEMENTS_FOUND: 'transactions.importStatement.failure.noMovements',
  STATEMENT_IMPORT_TIMED_OUT: 'transactions.importStatement.failure.timedOut'
};
const GENERIC_FAILURE_MESSAGE_KEY = 'transactions.importStatement.failure.generic';

export class StatementImport {
  /** i18n key of the failure message. Set only when the import FAILED. */
  public readonly failureMessageKey: string | null;

  constructor(
    public readonly importId: string,
    public readonly status: StatementImportStatus,
    public readonly errorCode: string | null,
    public readonly summary: StatementImportSummary | null,
    public readonly movements: StatementImportMovement[],
  ) {
    this.failureMessageKey = status === 'FAILED'
      ? FAILURE_MESSAGE_KEYS[errorCode ?? ''] ?? GENERIC_FAILURE_MESSAGE_KEY
      : null;
  }

  get isProcessing(): boolean {
    return this.status === 'PROCESSING';
  }

  get isDone(): boolean {
    return this.status === 'DONE';
  }

  get isFailed(): boolean {
    return this.status === 'FAILED';
  }

  static fromApiResponse(response: StatementImportResponse): StatementImport {
    return new StatementImport(
      response.importId,
      response.status,
      response.errorCode,
      response.summary ? StatementImportSummary.fromApiResponse(response.summary) : null,
      response.movements.map(movement => StatementImportMovement.fromApiResponse(movement))
    );
  }
}
