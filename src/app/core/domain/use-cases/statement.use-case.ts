import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StatementRepository } from '../repositories/statement.repository';
import { StatementClassification } from '../features/statements';

@Injectable({
  providedIn: 'root'
})
export class StatementUseCase {

  constructor(private statementRepository: StatementRepository) {}

  extractMovements(file: File, password: string | null): Observable<StatementClassification> {
    return this.statementRepository.extractMovements(file, password);
  }
}
