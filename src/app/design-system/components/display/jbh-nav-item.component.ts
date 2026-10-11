import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonItem, IonLabel } from '@ionic/angular/standalone';
import { JbhIconComponent } from '../icon/jbh-icon.component';

export type JbhNavItemLevel = 1 | 2 | 3;

/**
 * One row of the side menu. Content is the label. Content marked `jbhNavItemEnd` shows at the end
 * of the row, before the chevron.
 */
@Component({
  selector: 'jbh-nav-item',
  standalone: true,
  imports: [IonItem, IonLabel, JbhIconComponent],
  templateUrl: './jbh-nav-item.component.html',
  styleUrls: ['./jbh-nav-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-current]': 'active() ? "true" : null',
    '(click)': 'activate.emit()'
  }
})
export class JbhNavItemComponent {
  /** Icon name from the icon registry. */
  readonly icon = input.required<string>();
  readonly level = input<JbhNavItemLevel>(1);
  readonly active = input(false);
  /** Chevron state. `null` hides the chevron. */
  readonly expanded = input<boolean | null>(null);

  readonly activate = output<void>();

  protected readonly chevron = computed(() => (this.expanded() ? 'chevron-up-outline' : 'chevron-down-outline'));
  protected readonly hostClasses = computed(
    () => `jbh-nav-item jbh-nav-item--level-${this.level()}${this.active() ? ' jbh-nav-item--active' : ''}`
  );
}
