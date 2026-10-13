import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type JbhSkeletonShape = 'line' | 'label' | 'input' | 'select' | 'header' | 'table' | 'block';

/** Loading placeholder. `width` and `height` are CSS lengths and override the size of the shape. */
@Component({
  selector: 'jbh-skeleton',
  standalone: true,
  templateUrl: './jbh-skeleton.component.html',
  styleUrls: ['./jbh-skeleton.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[style.width]': 'width() ?? null',
    '[style.height]': 'height() ?? null',
    'aria-hidden': 'true'
  }
})
export class JbhSkeletonComponent {
  readonly shape = input<JbhSkeletonShape>('line');
  readonly width = input<string>();
  readonly height = input<string>();

  protected readonly hostClasses = computed(() => `jbh-skeleton jbh-skeleton--${this.shape()}`);
}
