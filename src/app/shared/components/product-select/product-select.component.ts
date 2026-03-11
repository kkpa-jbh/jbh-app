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
import { walletOutline, alertCircleOutline } from 'ionicons/icons';
import { ProductListItem } from '@core/domain/features/products';
import { SelectInterface } from '@core/infrastructure/viewport/viewport.service';

@Component({
  selector: 'app-product-select',
  templateUrl: './product-select.component.html',
  styleUrls: ['./product-select.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule
  ],
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

  @Input() products: ProductListItem[] = [];
  @Input() isLoading = false;
  @Input() selectInterface: SelectInterface = 'action-sheet';
  @Input() placeholder = '';
  @Input() hasError = false;
  @Input() emptyOption: { label: string; value: string | null } | undefined = undefined;

  selectedValue: string | null = null;
  isDisabled = false;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef) {
    addIcons({ walletOutline, alertCircleOutline });
  }

  writeValue(value: string | null): void {
    this.selectedValue = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string | null) => void): void {
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
    const value = event.detail.value as string | null;
    this.selectedValue = value;
    this.onChange(value);
    this.onTouched();
    this.cdr.markForCheck();
  }
}
