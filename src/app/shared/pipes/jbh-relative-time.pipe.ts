import { Pipe, PipeTransform } from '@angular/core';
import { formatRelativeTime } from '@core/formatting';

@Pipe({
  name: 'jbhRelativeTime',
  standalone: true,
  pure: true
})
export class JbhRelativeTimePipe implements PipeTransform {
  transform(value: Date | string | null | undefined): string {
    return formatRelativeTime(value, new Date());
  }
}
