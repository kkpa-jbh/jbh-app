import { Observable } from 'rxjs';
import { Preferences, UpdatePreferencesRequest } from '../models/preferences.model';

export abstract class PreferencesRepository {
  abstract getPreferences(): Observable<Preferences>;
  abstract updatePreferences(request: UpdatePreferencesRequest): Observable<Preferences>;
}
