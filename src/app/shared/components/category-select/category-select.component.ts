import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  TouchedChangeEvent
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { Category } from '@core/domain/features/categories';
import { JbhIconComponent, JbhSelectComponent, JbhSelectOptionComponent } from '@design-system/components';
import { JbhDisplayNamePipe } from '@shared/pipes';

@Component({
  selector: 'app-category-select',
  templateUrl: './category-select.component.html',
  styleUrls: ['./category-select.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    JbhDisplayNamePipe,
    JbhIconComponent,
    JbhSelectComponent,
    JbhSelectOptionComponent
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategorySelectComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySelectComponent implements ControlValueAccessor {
  readonly categories = input<Category[]>([]);
  readonly isLoading = input(false);
  readonly placeholder = input('');
  readonly hasError = input(false);

  /** Inner form control that feeds `jbh-select`; this component forwards its changes to the outer form. */
  protected readonly control = new FormControl<number | null>(null);
  private readonly selectedId = signal<number | null>(null);

  protected readonly selectedCategory = computed(() => {
    const id = this.selectedId();
    return id != null ? (this.categories().find(c => c.id === id) ?? null) : null;
  });

  protected readonly hasDescription = computed(() => {
    const description = this.selectedCategory()?.description;
    if (!description) return false;
    return Object.keys(description).length > 0 && Object.values(description).some(v => v.trim().length > 0);
  });

  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.control.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => {
      this.selectedId.set(value);
      this.onChange(value);
    });

    this.control.events
      .pipe(
        filter((event): event is TouchedChangeEvent => event instanceof TouchedChangeEvent && event.touched),
        takeUntilDestroyed()
      )
      .subscribe(() => this.onTouched());
  }

  writeValue(id: number | null): void {
    this.selectedId.set(id);
    this.control.setValue(id, { emitEvent: false });
  }

  registerOnChange(fn: (value: number | null) => void): void {
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
