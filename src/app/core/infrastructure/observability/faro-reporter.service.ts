import { Injectable } from '@angular/core';
import { HttpRequest } from '@angular/common/http';
import { faro } from '@grafana/faro-web-sdk';
import { environment } from '@environments/environment';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { toPathTemplate } from './faro-url';

// 401 is the routine token refresh and 422 is normal form validation: both would be noise.
export function isReportableStatus(status: number): boolean {
  return status === 0 || (status >= 400 && status !== 401 && status !== 422);
}

/** The only app code that calls faro.api. It never throws. */
@Injectable({ providedIn: 'root' })
export class FaroReporterService {

  reportError(error: unknown): void {
    if (!environment.observability.enabled || error instanceof JBHError) {
      return;
    }
    try {
      // A value that is not an Error is replaced, so no object data is copied.
      faro.api.pushError(error instanceof Error ? error : new Error('Non-Error value thrown'));
    } catch {
      // Reporting must never break the app.
    }
  }

  reportApiFailure(request: HttpRequest<unknown>, status: number): void {
    if (!environment.observability.enabled || !isReportableStatus(status)) {
      return;
    }
    try {
      faro.api.pushEvent(
        'api_request_failed',
        { status: String(status), method: request.method, path_template: toPathTemplate(request.url) },
        'api'
      );
    } catch {
      // Reporting must never break the app.
    }
  }
}
