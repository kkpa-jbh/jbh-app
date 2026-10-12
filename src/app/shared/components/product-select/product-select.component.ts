import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  TouchedChangeEvent
} from '@angular/forms';
import { filter } from 'rxjs';
import { ProductListItem } from '@core/domain/features/products';
import { JbhSelectComponent, JbhSelectOptionComponent } from '@design-system/components';

@Component({
  selector: 'app-product-select',
  templateUrl: './product-select.component.html',
  styleUrls: ['./product-select.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, JbhSelectComponent, JbhSelectOptionComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProductSelectComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductSelectComponent implements ControlValueAccessor {
  readonly products = input<ProductListItem[]>([]);
  readonly isLoading = input(false);
  /** Not used: the overlay type now comes from `jbh-select`. Kept so pages not yet moved still compile. */
  readonly selectInterface = input<'action-sheet' | 'popover' | 'alert'>('action-sheet');
  readonly placeholder = input('');
  /** Marks the field invalid. The red frame and message show only when `errorMessage` is also set. */
  readonly hasError = input(false);
  /** Message under the select while `hasError` is true. Pages that show their own message leave it empty. */
  readonly errorMessage = input<string | null>(null);
  readonly emptyOption = input<{ label: string; value: string | null } | undefined>(undefined);

  /** Inner form control that feeds `jbh-select`; this component forwards its changes to the outer form. */
  protected readonly control = new FormControl<string | null>(null);

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.control.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => this.onChange(value));

    this.control.events
      .pipe(
        filter((event): event is TouchedChangeEvent => event instanceof TouchedChangeEvent && event.touched),
        takeUntilDestroyed()
      )
      .subscribe(() => this.onTouched());
  }

  writeValue(value: string | null): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
  }
}
