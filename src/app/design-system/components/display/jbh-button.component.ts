import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { JbhIconComponent } from '../icon/jbh-icon.component';
import { JbhSpinnerComponent } from '../icon/jbh-spinner.component';

export type JbhButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'success';

/**
 * Styles a native `button`, `a` or `label` as an app button. The page keeps `type`, `disabled`,
 * `(click)` and `routerLink` on the native element, so form submit and focus stay native.
 */
@Component({
  selector: 'button[jbhButton], a[jbhButton], label[jbhButton]',
  standalone: true,
  imports: [JbhIconComponent, JbhSpinnerComponent],
  templateUrl: './jbh-button.component.html',
  styleUrls: ['./jbh-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-busy]': 'loading() ? "true" : null'
  }
})
export class JbhButtonComponent {
  /** Variant name. An empty value (`<button jbhButton>`) means `primary`. */
  readonly variant = input<JbhButtonVariant | ''>('', { alias: 'jbhButton' });
  /** Full width. */
  readonly block = input(false, { transform: booleanAttribute });
  /** Shows a spinner in place of the icon. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Leading icon name from the icon registry. */
  readonly icon = input<string>();

  protected readonly hostClasses = computed(() => {
    const classes = ['jbh-button', `jbh-button--${this.variant() || 'primary'}`];
    if (this.block()) classes.push('jbh-button--block');
    if (this.loading()) classes.push('jbh-button--loading');
    return classes.join(' ');
  });
}
