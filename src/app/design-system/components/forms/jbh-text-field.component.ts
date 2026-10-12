import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { JbhIconComponent } from '../icon/jbh-icon.component';
import { nextId } from '../internal/next-id';
import { describedBy } from './field-aria';
import { JbhFieldComponent, JbhFieldRequirement } from './jbh-field.component';

export type JbhTextFieldType = 'text' | 'email' | 'password';

/** Single-line text input with label, hint and error. Passwords get a reveal button. */
@Component({
  selector: 'jbh-text-field',
  standalone: true,
  imports: [JbhFieldComponent, JbhIconComponent, TranslatePipe],
  templateUrl: './jbh-text-field.component.html',
  styleUrls: ['./jbh-text-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => JbhTextFieldComponent), multi: true }]
})
export class JbhTextFieldComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly type = input<JbhTextFieldType>('text');
  /** Leading icon name from the icon registry. */
  readonly icon = input<string>();
  readonly placeholder = input<string>('');
  readonly autocomplete = input<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>(null);
  readonly requirement = input<JbhFieldRequirement>(null);

  protected readonly inputId = nextId('jbh-text-field');
  protected readonly value = signal('');
  protected readonly disabledByForm = signal(false);
  protected readonly revealed = signal(false);

  protected readonly isPassword = computed(() => this.type() === 'password');
  protected readonly inputType = computed(() => (this.isPassword() && this.revealed() ? 'text' : this.type()));
  protected readonly hasError = computed(() => !!this.error());
  protected readonly describedBy = computed(() => describedBy(this.inputId, !!this.hint(), this.hasError()));

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected toggleReveal(): void {
    this.revealed.update(current => !current);
  }
}
