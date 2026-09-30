import { Observable } from 'rxjs';
import { StatementClassification } from '../features/statements';

export abstract class StatementRepository {
  abstract extractMovements(file: File, password: string | null): Observable<StatementClassification>;
}
