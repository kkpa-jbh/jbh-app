import { ChangeDetectionStrategy, Component, booleanAttribute, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonToggle, ToggleChangeEventDetail } from '@ionic/angular/standalone';

/** On/off switch with a visible label. Works with a form control or with `[(checked)]`. */
@Component({
  selector: 'jbh-toggle',
  standalone: true,
  imports: [IonToggle],
  templateUrl: './jbh-toggle.component.html',
  styleUrls: ['./jbh-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => JbhToggleComponent), multi: true }]
})
export class JbhToggleComponent implements ControlValueAccessor {
  /** Visible label. Required, because it is the accessible name of the switch. */
  readonly label = input.required<string>();
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());

  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  // The standalone Ionic proxies declare no outputs, so the template event is a plain `Event`.
  protected onToggle(event: Event): void {
    const next = (event as CustomEvent<ToggleChangeEventDetail>).detail?.checked;
    // Ionic also fires this event when `checked` is set from outside. Ignore an unchanged value.
    if (typeof next !== 'boolean' || next === this.checked()) return;

    this.checked.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
