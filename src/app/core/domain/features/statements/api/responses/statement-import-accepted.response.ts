/**
 * API Response Interface (HTTP Boundary)
 *
 * This interface MUST exactly match the backend StatementImportAcceptedResponse object.
 * DO NOT modify to fit UI needs - create Models for that purpose.
 */

import { StatementImportStatus } from '../../types/statement.types';

export interface StatementImportAcceptedResponse {
  importId: string;
  status: StatementImportStatus;
}
