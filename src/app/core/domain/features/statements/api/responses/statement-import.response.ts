/**
 * API Response Interface (HTTP Boundary)
 *
 * This interface MUST exactly match the backend StatementImportResponse object.
 * DO NOT modify to fit UI needs - create Models for that purpose.
 */

import { StatementImportStatus } from '../../types/statement.types';
import { StatementImportMovementResponse } from './statement-import-movement.response';
import { StatementImportSummaryResponse } from './statement-import-summary.response';

export interface StatementImportResponse {
  importId: string;
  status: StatementImportStatus;
  /** The error name when `status` is `FAILED`, else `null`. */
  errorCode: string | null;
  startedAt: string;
  finishedAt: string | null;
  /** `null` while the import is processing, or when it failed. */
  summary: StatementImportSummaryResponse | null;
  movements: StatementImportMovementResponse[];
}
