import { Pipe, PipeTransform } from '@angular/core';
import { formatGrowth } from '@core/formatting';

@Pipe({
  name: 'jbhGrowth',
  standalone: true
})
export class JbhGrowthPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatGrowth(value);
  }
}
