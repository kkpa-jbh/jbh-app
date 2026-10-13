import { ChangeDetectionStrategy, Component, computed, forwardRef, input, numberAttribute, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonTextarea } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { JbhIconComponent } from '../icon/jbh-icon.component';
import { nextId } from '../internal/next-id';
import { describedBy } from './field-aria';
import { JbhFieldComponent, JbhFieldRequirement } from './jbh-field.component';

/** Reads `maxlength="500"` (a string) or `[maxlength]="500"`. Anything that is not a number means no limit. */
function toMaxLength(value: unknown): number | undefined {
  const parsed = numberAttribute(value, NaN);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** Multi-line text input that grows with its content. With `maxlength` it shows a character counter. */
@Component({
  selector: 'jbh-textarea',
  standalone: true,
  imports: [IonTextarea, JbhFieldComponent, JbhIconComponent, TranslatePipe],
  templateUrl: './jbh-textarea.component.html',
  styleUrls: ['./jbh-textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => JbhTextareaComponent), multi: true }]
})
export class JbhTextareaComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly rows = input(3, { transform: numberAttribute });
  readonly maxlength = input<number | undefined, unknown>(undefined, { transform: toMaxLength });
  /** Leading icon name from the icon registry. */
  readonly icon = input<string>();
  readonly placeholder = input<string>('');
  readonly hint = input<string>();
  readonly error = input<string | null>(null);
  readonly requirement = input<JbhFieldRequirement>(null);

  protected readonly controlId = nextId('jbh-textarea');
  protected readonly labelId = `${this.controlId}-label`;
  protected readonly value = signal('');
  protected readonly disabledByForm = signal(false);

  protected readonly hasError = computed(() => !!this.error());
  protected readonly describedBy = computed(() => describedBy(this.controlId, !!this.hint(), this.hasError()));
  protected readonly length = computed(() => this.value().length);

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

  // The standalone Ionic proxies declare no outputs, so the template event is a plain `Event`.
  protected onInput(event: Event): void {
    const next = (event as CustomEvent<{ value?: string | null }>).detail?.value ?? '';
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
