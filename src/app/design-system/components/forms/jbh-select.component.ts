import { ChangeDetectionStrategy, Component, booleanAttribute, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonSelect, SelectChangeEventDetail } from '@ionic/angular/standalone';
import { JbhViewportService } from '@design-system/platform/viewport';
import { JbhIconComponent } from '../icon/jbh-icon.component';
import { JbhSpinnerComponent } from '../icon/jbh-spinner.component';
import { nextId } from '../internal/next-id';
import { describedBy } from './field-aria';
import { JbhFieldComponent, JbhFieldRequirement } from './jbh-field.component';

/**
 * Select with projected `jbh-select-option` children. It opens a popover on wide screens
 * and an action sheet on small ones, with the label as the overlay header.
 */
@Component({
  selector: 'jbh-select',
  standalone: true,
  imports: [IonSelect, JbhFieldComponent, JbhIconComponent, JbhSpinnerComponent],
  templateUrl: './jbh-select.component.html',
  styleUrls: ['./jbh-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => JbhSelectComponent), multi: true }]
})
export class JbhSelectComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly placeholder = input<string>('');
  /** Leading icon name from the icon registry. */
  readonly icon = input<string>();
  /** Shows a spinner and disables the select while options load. */
  readonly loading = input(false, { transform: booleanAttribute });
  readonly hint = input<string>();
  readonly error = input<string | null>(null);
  readonly requirement = input<JbhFieldRequirement>(null);

  protected readonly selectId = nextId('jbh-select');
  protected readonly labelId = `${this.selectId}-label`;
  protected readonly value = signal<unknown>(undefined);
  protected readonly disabledByForm = signal(false);

  private readonly viewport = inject(JbhViewportService);

  protected readonly overlay = computed(() => (this.viewport.wide() ? 'popover' : 'action-sheet'));
  protected readonly overlayOptions = computed(() => {
    const header = this.label();
    return header ? { header } : {};
  });
  protected readonly isDisabled = computed(() => this.loading() || this.disabledByForm());
  protected readonly hasError = computed(() => !!this.error());
  protected readonly describedBy = computed(() => describedBy(this.selectId, !!this.hint(), this.hasError()));

  private onChange: (value: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  // The standalone Ionic proxies declare no outputs, so the template event is a plain `Event`.
  protected onSelectChange(event: Event): void {
    const next = (event as CustomEvent<SelectChangeEventDetail>).detail?.value;
    // Ionic can also fire this event when the value is set from the form. Ignore an unchanged value.
    if (next === this.value()) return;

    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }

  protected onDismiss(): void {
    this.onTouched();
  }
}
