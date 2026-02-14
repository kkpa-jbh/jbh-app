import { Observable } from 'rxjs';
import { Preferences, UpdatePreferencesRequest } from '../features/preferences';

export abstract class PreferencesRepository {
  abstract getPreferences(): Observable<Preferences>;
  abstract updatePreferences(request: UpdatePreferencesRequest): Observable<Preferences>;
}
