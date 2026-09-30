import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatementRepository } from '@core/domain/repositories/statement.repository';
import { StatementClassification, StatementClassificationResponse } from '@core/domain/features/statements';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';
import { HttpClient } from '@angular/common/http';
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

@Injectable({
  providedIn: 'root'
})
export class StatementRepositoryImpl extends ApiBaseService implements StatementRepository {

  private readonly EXTRACT_ENDPOINT = '/finance/statements/extract';
  // The server reads the PDF with AI (up to 120 s), then classifies it. The default 30 s is too short.
  private readonly EXTRACT_TIMEOUT_MS = 150000;

  constructor(http: HttpClient, envConfig: EnvironmentConfig, logger: LoggerService) {
    super(http, envConfig, logger);
  }

  extractMovements(file: File, password: string | null): Observable<StatementClassification> {
    // No Content-Type header: the browser adds the multipart boundary.
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (password) {
      formData.append('password', password);
    }

    return this.post<StatementClassificationResponse>(
      this.EXTRACT_ENDPOINT,
      formData,
      undefined,
      this.EXTRACT_TIMEOUT_MS
    ).pipe(
      map(response => StatementClassification.fromApiResponse(response))
    );
  }
}
