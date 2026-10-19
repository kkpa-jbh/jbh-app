import { Pipe, PipeTransform, inject } from '@angular/core';
import { pickDisplayName } from '@core/formatting';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';

// Impure on purpose: the text must follow a language change.
@Pipe({
  name: 'jbhDisplayName',
  standalone: true,
  pure: false
})
export class JbhDisplayNamePipe implements PipeTransform {
  private readonly translationService = inject(TranslationService);

  transform(displayName: Record<string, string> | null | undefined, fallback: string = ''): string {
    return pickDisplayName(displayName, this.translationService.getCurrentLanguage(), fallback);
  }
}
