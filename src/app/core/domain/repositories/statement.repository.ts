import { Observable } from 'rxjs';
import { StatementImport } from '../features/statements';

export abstract class StatementRepository {
  /** Uploads the PDF and starts the import in the background. Emits the new import id. */
  abstract startImport(productId: string, file: File, password: string | null): Observable<string>;

  /** Reads the current state of one import. */
  abstract findImport(productId: string, importId: string): Observable<StatementImport>;
}
