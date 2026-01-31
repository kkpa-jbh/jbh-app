import { Observable } from 'rxjs';
import { Preferences, UpdatePreferencesDto } from '../models/preferences.model';

export abstract class PreferencesRepository {
  abstract getPreferences(): Observable<Preferences>;
  abstract updatePreferences(request: UpdatePreferencesDto): Observable<Preferences>;
}
