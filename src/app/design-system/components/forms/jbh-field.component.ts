import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { JbhIconComponent } from '../icon/jbh-icon.component';

export type JbhFieldRequirement = 'required' | 'optional' | null;

/**
 * Frame of a form control: label, requirement marker, projected control, hint and error.
 * Ids follow `controlId`: `<id>-label`, `<id>-hint`, `<id>-error`.
 */
@Component({
  selector: 'jbh-field',
  standalone: true,
  imports: [JbhIconComponent, TranslatePipe],
  templateUrl: './jbh-field.component.html',
  styleUrls: ['./jbh-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JbhFieldComponent {
  readonly label = input<string>();
  /** Id of the control (or of its trigger). The label, hint and error ids derive from it. */
  readonly controlId = input.required<string>();
  readonly hint = input<string>();
  /** Error message. A non-empty string shows; an empty string or null shows nothing. */
  readonly error = input<string | null>(null);
  readonly requirement = input<JbhFieldRequirement>(null);
  /** True when the control is a native labelable element, so the label can use `for`. */
  readonly native = input(true, { transform: booleanAttribute });
}
