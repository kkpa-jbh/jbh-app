import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, numberAttribute, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  cleanDecimalOnBlur,
  DecimalSeparators,
  formatDecimalForDisplay,
  groupThousands,
  isAllowedDecimalText,
  parseDecimal,
  stripThousands
} from '@core/formatting';
import { APP_CONFIG_TOKEN } from '@core/infrastructure/config/app.config';
import { JbhIconComponent } from '../icon/jbh-icon.component';
import { nextId } from '../internal/next-id';
import { describedBy } from './field-aria';
import { JbhFieldComponent, JbhFieldRequirement } from './jbh-field.component';

/**
 * Number input with a `number | null` form value. While the user edits, the text has no thousands
 * separators; on blur it is grouped (`1,234.56`). Invalid keystrokes and pastes are rejected.
 */
@Component({
  selector: 'jbh-number-field',
  standalone: true,
  imports: [JbhFieldComponent, JbhIconComponent],
  templateUrl: './jbh-number-field.component.html',
  styleUrls: ['./jbh-number-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => JbhNumberFieldComponent), multi: true }]
})
export class JbhNumberFieldComponent implements ControlValueAccessor {
  readonly label = input<string>();
  /** Maximum decimal places. 0 means integers only. */
  readonly decimals = input(2, { transform: numberAttribute });
  /** Leading icon name from the icon registry. */
  readonly icon = input<string>();
  readonly placeholder = input<string>('');
  readonly hint = input<string>();
  readonly error = input<string | null>(null);
  readonly requirement = input<JbhFieldRequirement>(null);

  protected readonly inputId = nextId('jbh-number-field');
  protected readonly text = signal('');
  protected readonly disabledByForm = signal(false);

  protected readonly hasError = computed(() => !!this.error());
  protected readonly describedBy = computed(() => describedBy(this.inputId, !!this.hint(), this.hasError()));
  protected readonly inputMode = computed(() => (this.decimals() === 0 ? 'numeric' : 'decimal'));

  private readonly separators: DecimalSeparators = inject(APP_CONFIG_TOKEN).numberFormat;
  /** Last text the user typed that passed validation. An invalid keystroke goes back to it. */
  private previousText = '';
  /** Last number given to or taken from the form. Blur does not report an unchanged number. */
  private lastValue: number | null = null;

  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: number | null): void {
    const shown = formatDecimalForDisplay(value, this.separators);
    this.text.set(shown);
    this.previousText = shown;
    this.lastValue = value ?? null;
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  protected onFocus(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = stripThousands(input.value, this.separators);
    input.value = raw;
    this.text.set(raw);
    this.previousText = raw;
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const current = input.value;

    if (!isAllowedDecimalText(current, this.decimals(), this.separators)) {
      input.value = this.previousText;
      return;
    }

    this.accept(current);
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const cleaned = stripThousands(pasted, this.separators);
    if (!isAllowedDecimalText(cleaned, this.decimals(), this.separators)) return;

    (event.target as HTMLInputElement).value = cleaned;
    this.accept(cleaned);
  }

  protected onBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = cleanDecimalOnBlur(input.value, this.decimals(), this.separators);
    const parsed = parseDecimal(cleaned, this.separators);

    if (parsed === null) {
      // Empty text or a lone '-': nothing to keep.
      input.value = '';
      this.text.set('');
      this.previousText = '';
      this.emit(null);
    } else {
      const shown = groupThousands(cleaned, this.separators);
      input.value = shown;
      this.text.set(shown);
      this.previousText = cleaned;
      this.emit(parsed);
    }
    this.onTouched();
  }

  /** Keeps valid text and reports the number. Text that ends with the decimal separator is not complete yet. */
  private accept(text: string): void {
    this.text.set(text);
    this.previousText = text;
    if (text.endsWith(this.separators.decimalSeparator)) return;
    this.emit(parseDecimal(text, this.separators));
  }

  private emit(value: number | null): void {
    if (value === this.lastValue) return;
    this.lastValue = value;
    this.onChange(value);
  }
}
