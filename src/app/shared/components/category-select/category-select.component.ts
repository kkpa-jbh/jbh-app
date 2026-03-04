import {
  Component,
  Input,
  forwardRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { pricetagOutline, alertCircleOutline, informationCircleOutline } from 'ionicons/icons';
import { Category } from '@core/domain/features/categories';
import { SelectInterface } from '@core/infrastructure/viewport/viewport.service';
import { JbhDisplayNamePipe } from '@shared/pipes';

@Component({
  selector: 'app-category-select',
  templateUrl: './category-select.component.html',
  styleUrls: ['./category-select.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    JbhDisplayNamePipe
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

  @Input() categories: Category[] = [];
  @Input() isLoading = false;
  @Input() selectInterface: SelectInterface = 'action-sheet';
  @Input() placeholder = '';
  @Input() hasError = false;

  selectedCategoryId: number | null = null;
  selectedCategory: Category | null = null;
  isDisabled = false;

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef) {
    addIcons({ pricetagOutline, alertCircleOutline, informationCircleOutline });
  }

  writeValue(id: number | null): void {
    this.selectedCategoryId = id;
    this.selectedCategory = id != null
      ? (this.categories.find(c => c.id === id) ?? null)
      : null;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onSelectionChange(event: CustomEvent): void {
    const value = event.detail.value as number | null;
    this.selectedCategoryId = value;
    this.selectedCategory = value != null
      ? (this.categories.find(c => c.id === value) ?? null)
      : null;
    this.onChange(value);
    this.onTouched();
    this.cdr.markForCheck();
  }

  hasDescription(): boolean {
    if (!this.selectedCategory?.description) return false;
    const desc = this.selectedCategory.description;
    return Object.keys(desc).length > 0 && Object.values(desc).some(v => v.trim().length > 0);
  }
}
