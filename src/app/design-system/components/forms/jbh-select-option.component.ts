import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonSelectOption } from '@ionic/angular/standalone';

/**
 * One option of a `jbh-select`. The label is the projected content, so templates can use pipes.
 * `ion-select` finds its options in all descendants, so this wrapper does not break it.
 */
@Component({
  selector: 'jbh-select-option',
  standalone: true,
  imports: [IonSelectOption],
  templateUrl: './jbh-select-option.component.html',
  styleUrls: ['./jbh-select-option.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JbhSelectOptionComponent {
  /** Value the form receives when the user picks this option. */
  readonly value = input.required<unknown>();
}
