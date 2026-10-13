import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type JbhCardVariant = 'default' | 'elevated' | 'flat' | 'form';

/** Surface that holds page content. */
@Component({
  selector: 'jbh-card',
  standalone: true,
  templateUrl: './jbh-card.component.html',
  styleUrls: ['./jbh-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' }
})
export class JbhCardComponent {
  readonly variant = input<JbhCardVariant>('default');

  protected readonly hostClasses = computed(() => `jbh-card jbh-card--${this.variant()}`);
}
