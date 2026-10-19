import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { JbhIconComponent } from '../icon/jbh-icon.component';

export type JbhPageHeaderVariant = 'page' | 'form';

/** Page or form heading with an optional icon and subtitle. Projected content is the action area. */
@Component({
  selector: 'jbh-page-header',
  standalone: true,
  imports: [JbhIconComponent],
  templateUrl: './jbh-page-header.component.html',
  styleUrls: ['./jbh-page-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    // A static `title` attribute would also show as a native tooltip.
    '[attr.title]': 'null'
  }
})
export class JbhPageHeaderComponent {
  /** Icon name from the icon registry. */
  readonly icon = input<string>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly variant = input<JbhPageHeaderVariant>('page');

  protected readonly hostClasses = computed(() => `jbh-page-header jbh-page-header--${this.variant()}`);
}
