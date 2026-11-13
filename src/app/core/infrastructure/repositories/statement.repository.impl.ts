import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatementRepository } from '@core/domain/repositories/statement.repository';
import {
  StatementImport,
  StatementImportAcceptedResponse,
  StatementImportResponse
} from '@core/domain/features/statements';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';
import { HttpClient } from '@angular/common/http';
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

@Injectable({
  providedIn: 'root'
})
export class StatementRepositoryImpl extends ApiBaseService implements StatementRepository {

  // The server checks and unlocks the PDF before it answers 202. A large PDF can pass the default 30 s.
  private readonly START_TIMEOUT_MS = 60000;

  constructor(http: HttpClient, envConfig: EnvironmentConfig, logger: LoggerService) {
    super(http, envConfig, logger);
  }

  startImport(productId: string, file: File, password: string | null): Observable<string> {
    // No Content-Type header: the browser adds the multipart boundary.
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (password) {
      formData.append('password', password);
    }

    return this.post<StatementImportAcceptedResponse>(
      this.importsEndpoint(productId),
      formData,
      undefined,
      this.START_TIMEOUT_MS
    ).pipe(
      map(response => response.importId)
    );
  }

  findImport(productId: string, importId: string): Observable<StatementImport> {
    return this.get<StatementImportResponse>(`${this.importsEndpoint(productId)}/${importId}`).pipe(
      map(response => StatementImport.fromApiResponse(response))
    );
  }

  private importsEndpoint(productId: string): string {
    return `/finance/products/${productId}/statement-imports`;
  }
}
