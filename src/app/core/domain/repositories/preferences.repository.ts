import { Observable } from 'rxjs';
import { Preferences, UpdatePreferencesDto } from '../features/preferences';

export abstract class PreferencesRepository {
  abstract getPreferences(): Observable<Preferences>;
  abstract updatePreferences(request: UpdatePreferencesDto): Observable<Preferences>;
}
