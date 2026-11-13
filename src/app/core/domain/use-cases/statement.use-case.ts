import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { exhaustMap, switchMap, takeWhile } from 'rxjs/operators';
import { StatementRepository } from '../repositories/statement.repository';
import { StatementImport } from '../features/statements';

/** Time between two polls of a running import. */
const POLL_INTERVAL_MS = 3000;

@Injectable({
  providedIn: 'root'
})
export class StatementUseCase {

  constructor(private statementRepository: StatementRepository) {}

  /**
   * Starts the import of a statement PDF into a product, then polls it.
   *
   * Emits the import state on every poll. Completes after the first DONE or FAILED state.
   * The backend marks a stuck import as FAILED, so the polling always ends.
   * Unsubscribe to stop polling. The import keeps running on the server.
   */
  importStatement(productId: string, file: File, password: string | null): Observable<StatementImport> {
    return this.statementRepository.startImport(productId, file, password).pipe(
      switchMap(importId => this.watchImport(productId, importId))
    );
  }

  private watchImport(productId: string, importId: string): Observable<StatementImport> {
    // exhaustMap: a slow poll is never cancelled by the next tick.
    return timer(0, POLL_INTERVAL_MS).pipe(
      exhaustMap(() => this.statementRepository.findImport(productId, importId)),
      takeWhile(statementImport => statementImport.isProcessing, true)
    );
  }
}
