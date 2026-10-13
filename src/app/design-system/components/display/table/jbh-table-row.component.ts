import { ChangeDetectionStrategy, Component } from '@angular/core';

/** One table row. Put `jbh-table-cell` elements inside. */
@Component({
  selector: 'jbh-table-row',
  standalone: true,
  templateUrl: './jbh-table-row.component.html',
  styleUrls: ['./jbh-table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'row' }
})
export class JbhTableRowComponent {}
