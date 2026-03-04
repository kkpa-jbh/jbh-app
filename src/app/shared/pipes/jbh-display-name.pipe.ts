import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';

@Pipe({
  name: 'jbhDisplayName',
  standalone: true,
  pure: false
})
export class JbhDisplayNamePipe implements PipeTransform {
  constructor(private translationService: TranslationService) {}

  transform(displayName: Record<string, string> | null | undefined, fallback: string = ''): string {
    if (!displayName) return fallback;
    const lang = this.translationService.getCurrentLanguage();
    return displayName[lang] ?? displayName['en'] ?? fallback;
  }
}
