import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { APP_CONFIG_TOKEN } from '@core/infrastructure/config/app.config';

/**
 * Directive for formatting numeric inputs with decimal and thousand separators.
 *
 * @description
 * This directive provides input formatting for numeric fields with the following features:
 * - Restricts input to valid numeric characters based on maxDecimals configuration
 * - Displays formatted numbers with thousand separators for better readability
 * - Maintains raw numeric values in the form control for API submission
 *
 * @usageNotes
 *
 * ### Behavior Summary
 *
 * | Event   | Behavior                                                    |
 * |---------|-------------------------------------------------------------|
 * | Focus   | Removes thousand separators for easier editing              |
 * | Input   | Validates against regex, reverts invalid input              |
 * | Paste   | Strips thousand separators, validates, then accepts/rejects |
 * | Blur    | Cleans trailing separators, formats with thousand separators|
 *
 * ### Configuration
 *
 * The directive uses global configuration from `APP_CONFIG` for:
 * - `decimalSeparator`: Character for decimal point (default: '.')
 * - `thousandsSeparator`: Character for grouping thousands (default: ',')
 *
 * ### Example Usage
 *
 * ```html
 * <!-- Integer field (no decimals allowed) -->
 * <input type="text" inputmode="numeric" [jbhDecimalFormat]="0" formControlName="quantity" />
 *
 * <!-- Decimal field (max 2 decimal places) -->
 * <input type="text" inputmode="decimal" [jbhDecimalFormat]="2" formControlName="price" />
 * ```
 *
 * ### Display vs Form Value
 *
 * | User Input | Display (on blur) | Form Control Value |
 * |------------|-------------------|--------------------|
 * | 1234       | 1,234             | 1234               |
 * | 1234.56    | 1,234.56          | 1234.56            |
 * | 1234567.89 | 1,234,567.89      | 1234567.89         |
 *
 * @selector [jbhDecimalFormat]
 * @standalone true
 */
@Directive({
  selector: '[jbhDecimalFormat]',
  standalone: true
})
export class DecimalFormatDirective {
  private _maxDecimals: number = 2;
  private previousValue: string = '';

  /**
   * Maximum number of decimal places allowed.
   * - Set to 0 for integer-only input
   * - Set to 2 for currency/decimal values
   */
  @Input('jbhDecimalFormat')
  set maxDecimals(value: number) {
    this._maxDecimals = value;
    this.buildRegex();
  }
  get maxDecimals(): number {
    return this._maxDecimals;
  }

  private regex!: RegExp;

  private el = inject(ElementRef<HTMLInputElement>);
  private ngControl = inject(NgControl);
  private appConfig = inject(APP_CONFIG_TOKEN);

  get decimalSeparator(): string {
    return this.appConfig.numberFormat.decimalSeparator;
  }

  get thousandsSeparator(): string {
    return this.appConfig.numberFormat.thousandsSeparator;
  }

  constructor() {
    this.buildRegex();
  }

  private buildRegex(): void {
    const escapedSeparator = this.escapeRegex(this.decimalSeparator);

    if (this._maxDecimals === 0) {
      this.regex = /^-?\d*$/;
    } else {
      this.regex = new RegExp(`^-?\\d*${escapedSeparator}?\\d{0,${this._maxDecimals}}$`);
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Formats a numeric string with thousand separators.
   * Example: "1234567.89" → "1,234,567.89"
   */
  private formatWithThousands(value: string): string {
    if (!value) return value;

    const parts = value.split(this.decimalSeparator);
    const integerPart = parts[0];
    const decimalPart = parts[1];

    const isNegative = integerPart.startsWith('-');
    const absoluteInteger = isNegative ? integerPart.slice(1) : integerPart;
    const formattedInteger = absoluteInteger.replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandsSeparator);
    const signedInteger = isNegative ? `-${formattedInteger}` : formattedInteger;

    return decimalPart !== undefined
      ? `${signedInteger}${this.decimalSeparator}${decimalPart}`
      : signedInteger;
  }

  /**
   * Removes thousand separators from a formatted string.
   * Example: "1,234,567.89" → "1234567.89"
   */
  private removeThousands(value: string): string {
    if (!value) return value;
    return value.replace(new RegExp(this.escapeRegex(this.thousandsSeparator), 'g'), '');
  }

  /**
   * On focus: Removes thousand separators to allow easier editing.
   * User sees raw number without formatting while typing.
   */
  @HostListener('focus')
  onFocus(): void {
    const raw = this.removeThousands(this.el.nativeElement.value);
    this.el.nativeElement.value = raw;
    this.previousValue = raw;
  }

  /**
   * On input: Validates each keystroke against the regex pattern.
   * - If valid: accepts input and updates form value (unless incomplete)
   * - If invalid: reverts to previous valid value
   */
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    if (currentValue === '' || this.regex.test(currentValue)) {
      this.previousValue = currentValue;
      if (!currentValue.endsWith(this.decimalSeparator)) {
        this.updateFormValue(currentValue);
      }
    } else {
      input.value = this.previousValue;
    }
  }

  /**
   * On paste: Strips thousand separators from pasted content before validation.
   * Allows users to paste formatted numbers (e.g., "1,234.56").
   */
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') ?? '';
    const cleanedText = this.removeThousands(pastedText);

    if (this.regex.test(cleanedText)) {
      this.el.nativeElement.value = cleanedText;
      this.previousValue = cleanedText;
      this.updateFormValue(cleanedText);
    }
  }

  /**
   * On blur: Cleans up the value and applies thousand separator formatting.
   * - Removes trailing decimal separator
   * - Truncates excess decimal places
   * - Formats with thousand separators for display
   * - Updates form control with clean numeric value
   */
  @HostListener('blur')
  onBlur(): void {
    let value = this.el.nativeElement.value;
    if (!value) return;

    if (value.endsWith(this.decimalSeparator)) {
      value = value.slice(0, -1);
    }

    if (this._maxDecimals > 0 && value.includes(this.decimalSeparator)) {
      const [integer, decimal] = value.split(this.decimalSeparator);
      if (decimal && decimal.length > this._maxDecimals) {
        value = `${integer}${this.decimalSeparator}${decimal.substring(0, this._maxDecimals)}`;
      }
    }

    this.previousValue = value;
    this.updateFormValue(value);
    this.el.nativeElement.value = this.formatWithThousands(value);
  }

  /**
   * Updates the form control with the raw numeric value.
   * The form always stores numbers without thousand separators.
   */
  private updateFormValue(value: string): void {
    const numericValue = value ? parseFloat(value.replace(this.decimalSeparator, '.')) : null;
    this.ngControl.control?.setValue(numericValue, { emitEvent: false });
  }
}
