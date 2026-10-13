import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatetimeChangeEventDetail, IonDatetime, IonDatetimeButton, IonModal } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { toDateValue } from '@core/formatting';
import { JbhIconComponent } from '../icon/jbh-icon.component';
import { nextId } from '../internal/next-id';
import { describedBy } from './field-aria';
import { JbhFieldComponent, JbhFieldRequirement } from './jbh-field.component';

export type JbhDateFieldMode = 'date' | 'month';

/**
 * Date picker field. The form value is `YYYY-MM-DD` (`mode="date"`) or `YYYY-MM` (`mode="month"`).
 * Any ISO 8601 text is accepted from the form and shown.
 */
@Component({
  selector: 'jbh-date-field',
  standalone: true,
  imports: [IonDatetime, IonDatetimeButton, IonModal, JbhFieldComponent, JbhIconComponent, TranslatePipe],
  templateUrl: './jbh-date-field.component.html',
  styleUrls: ['./jbh-date-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => JbhDateFieldComponent), multi: true }]
})
export class JbhDateFieldComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly mode = input<JbhDateFieldMode>('date');
  /** Earliest allowed date, as ISO text. */
  readonly min = input<string>();
  /** Latest allowed date, as ISO text. */
  readonly max = input<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>(null);
  readonly requirement = input<JbhFieldRequirement>(null);

  /** Unique in the whole document: Ionic keeps several pages mounted, so fixed ids would collide. */
  protected readonly pickerId = nextId('jbh-date-picker');
  protected readonly controlId = nextId('jbh-date-field');
  protected readonly labelId = `${this.controlId}-label`;
  protected readonly value = signal<string | null>(null);
  protected readonly disabledByForm = signal(false);

  protected readonly presentation = computed(() => (this.mode() === 'month' ? 'month-year' : 'date'));
  protected readonly hasError = computed(() => !!this.error());
  protected readonly describedBy = computed(() => describedBy(this.controlId, !!this.hint(), this.hasError()));

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value || null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  // The standalone Ionic proxies declare no outputs, so the template event is a plain `Event`.
  protected onPickerChange(event: Event): void {
    const picked = (event as CustomEvent<DatetimeChangeEventDetail>).detail?.value;
    if (typeof picked !== 'string') return;

    const next = toDateValue(picked, this.mode());
    // Ionic may also fire this event when the value is set from the form. Ignore an unchanged value.
    if (next === null || next === toDateValue(this.value(), this.mode())) return;

    this.value.set(next);
    this.onChange(next);
  }

  protected onPickerDismiss(): void {
    this.onTouched();
  }
}
