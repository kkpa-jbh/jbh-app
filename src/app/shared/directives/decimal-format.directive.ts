import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { APP_CONFIG_TOKEN } from '@core/infrastructure/config/app.config';

@Directive({
  selector: '[jbhDecimalFormat]',
  standalone: true
})
export class DecimalFormatDirective {
  private _maxDecimals: number = 2;
  private previousValue: string = '';

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

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    if (currentValue === '' || this.regex.test(currentValue)) {
      this.previousValue = currentValue;
    } else {
      input.value = this.previousValue;
      this.ngControl.control?.setValue(this.previousValue ? parseFloat(this.previousValue.replace(this.decimalSeparator, '.')) : null);
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';
    if (!this.regex.test(pastedText)) {
      event.preventDefault();
    }
  }

  @HostListener('blur')
  onBlur(): void {
    this.formatValue();
  }

  private formatValue(): void {
    const value = this.el.nativeElement.value;
    if (!value) return;

    let formatted = value;

    if (value.endsWith(this.decimalSeparator)) {
      formatted = value.slice(0, -1);
    }

    if (this._maxDecimals > 0 && formatted.includes(this.decimalSeparator)) {
      const [integer, decimal] = formatted.split(this.decimalSeparator);
      if (decimal && decimal.length > this._maxDecimals) {
        formatted = `${integer}${this.decimalSeparator}${decimal.substring(0, this._maxDecimals)}`;
      }
    }

    if (formatted !== value) {
      this.el.nativeElement.value = formatted;
      this.previousValue = formatted;
      const numericValue = formatted ? parseFloat(formatted.replace(this.decimalSeparator, '.')) : null;
      this.ngControl.control?.setValue(numericValue);
    }
  }
}
