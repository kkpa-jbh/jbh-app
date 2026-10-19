import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { JbhIconComponent } from '../icon/jbh-icon.component';

/** Centered "nothing here" block. Projected content (buttons) goes below the message. */
@Component({
  selector: 'jbh-empty-state',
  standalone: true,
  imports: [JbhIconComponent],
  templateUrl: './jbh-empty-state.component.html',
  styleUrls: ['./jbh-empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    // A static `title` attribute would also show as a native tooltip.
    '[attr.title]': 'null'
  }
})
export class JbhEmptyStateComponent {
  /** Icon name from the icon registry. */
  readonly icon = input<string>();
  readonly title = input.required<string>();
  readonly message = input<string>();
}
