import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { JbhIconComponent } from '../icon/jbh-icon.component';

export type JbhIconButtonTone = 'default' | 'primary' | 'danger';
export type JbhIconButtonSize = 'md' | 'sm';

/** Square button that holds only an icon. `label` is required, because it is the only accessible name. */
@Component({
  selector: 'button[jbhIconButton]',
  standalone: true,
  imports: [JbhIconComponent],
  templateUrl: './jbh-icon-button.component.html',
  styleUrls: ['./jbh-icon-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-label]': 'label()',
    '[attr.title]': 'label()'
  }
})
export class JbhIconButtonComponent {
  /** Tone name. An empty value (`<button jbhIconButton>`) means `default`. */
  readonly tone = input<JbhIconButtonTone | ''>('', { alias: 'jbhIconButton' });
  /** Icon name from the icon registry. */
  readonly icon = input.required<string>();
  /** Accessible name, also used as the tooltip. */
  readonly label = input.required<string>();
  readonly size = input<JbhIconButtonSize>('md');

  protected readonly hostClasses = computed(
    () => `jbh-icon-button jbh-icon-button--${this.tone() || 'default'} jbh-icon-button--${this.size()}`
  );
}
