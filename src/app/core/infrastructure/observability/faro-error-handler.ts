import { ErrorHandler, Injectable, inject } from '@angular/core';
import { FaroReporterService } from './faro-reporter.service';

/** Reports the error to Faro, then lets Angular's default handler write it to the console. */
@Injectable()
export class FaroErrorHandler implements ErrorHandler {
  private readonly reporter = inject(FaroReporterService);
  private readonly fallback = new ErrorHandler();

  handleError(error: unknown): void {
    this.reporter.reportError(error);
    this.fallback.handleError(error);
  }
}
