import { Pipe, PipeTransform, inject } from '@angular/core';
import { parseTranslationKey } from '@core/formatting';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';

// Impure on purpose: the text must follow a language change. The cache avoids a JSON parse per cycle.
@Pipe({
  name: 'jbhTranslationKey',
  standalone: true,
  pure: false
})
export class JbhTranslationKeyPipe implements PipeTransform {
  private cachedJson: string | null = null;
  private cachedLang: string | null = null;
  private cachedResult = '';
  private readonly translationService = inject(TranslationService);

  transform(jsonString: string | null | undefined): string {
    if (!jsonString) return '';

    const currentLang = this.translationService.getCurrentLanguage();

    if (this.cachedJson === jsonString && this.cachedLang === currentLang) {
      return this.cachedResult;
    }

    this.cachedJson = jsonString;
    this.cachedLang = currentLang;
    this.cachedResult = parseTranslationKey(jsonString, currentLang);
    return this.cachedResult;
  }
}
