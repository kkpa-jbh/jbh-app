import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jbhGrowth',
  standalone: true
})
export class JbhGrowthPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const numValue = value ?? 0;
    const prefix = numValue > 0 ? '+' : '';
    return prefix + numValue.toFixed(2) + '%';
  }
}
