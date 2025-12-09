import { HttpClient } from '@angular/common/http';
import { TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

/**
 * Factory function to create TranslateHttpLoader
 * Loads translation files from assets/i18n/
 */
export function createTranslateLoader(http: HttpClient): TranslateLoader {
  return new TranslateHttpLoader(http);
}
