import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { PreferencesRepository } from '@core/domain/repositories/preferences.repository';
import { Preferences, PreferencesApiResponse, UpdatePreferencesDto, toApiRequest } from '@core/domain/features/preferences';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

@Injectable({
  providedIn: 'root'
})
export class PreferencesRepositoryImpl extends ApiBaseService implements PreferencesRepository {

  private readonly PREFERENCES_ENDPOINT = '/preferences/v1';

  constructor(http: HttpClient, envConfig: EnvironmentConfig, logger: LoggerService) {
    super(http, envConfig, logger);
  }

  getPreferences(): Observable<Preferences> {
    return this.get<PreferencesApiResponse>(this.PREFERENCES_ENDPOINT).pipe(
      map(response => Preferences.fromApiResponse(response))
    );
  }

  updatePreferences(request: UpdatePreferencesDto): Observable<Preferences> {
    return this.put<PreferencesApiResponse>(this.PREFERENCES_ENDPOINT, toApiRequest(request)).pipe(
      map(response => Preferences.fromApiResponse(response))
    );
  }
}
