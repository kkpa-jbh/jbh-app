import { ChangeDetectionStrategy, Component, InjectionToken, computed, effect, inject, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { LoggerService } from '@core/infrastructure/logging';
import { isKnownIcon, registerJbhIcons } from './icon-registry';

/** Names already reported as unknown. Provided per injector, so each app (or test) starts empty. */
const WARNED_ICON_NAMES = new InjectionToken<Set<string>>('JBH_WARNED_ICON_NAMES', {
  providedIn: 'root',
  factory: () => new Set<string>()
});

@Component({
  selector: 'jbh-icon',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './jbh-icon.component.html',
  styleUrls: ['./jbh-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"'
  }
})
export class JbhIconComponent {
  /** Icon name from the registry. A plain string, because domain helpers return strings. */
  readonly name = input.required<string>();
  /** Accessible name. Without it the icon is hidden from screen readers. */
  readonly label = input<string>();

  protected readonly known = computed(() => isKnownIcon(this.name()));

  private readonly logger = inject(LoggerService);
  private readonly warnedNames = inject(WARNED_ICON_NAMES);

  constructor() {
    registerJbhIcons();

    effect(() => {
      const name = this.name();
      if (isKnownIcon(name) || this.warnedNames.has(name)) return;
      this.warnedNames.add(name);
      this.logger.warn(`Unknown icon "${name}". Add it to icon-registry.ts.`, 'JbhIcon');
    });
  }
}
