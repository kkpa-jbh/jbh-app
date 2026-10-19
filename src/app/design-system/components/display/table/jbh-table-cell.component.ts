import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/** One table cell. With `header` it is a column header. Pages set column widths with their own classes. */
@Component({
  selector: 'jbh-table-cell',
  standalone: true,
  templateUrl: './jbh-table-cell.component.html',
  styleUrls: ['./jbh-table-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'header() ? "columnheader" : "cell"',
    '[class.jbh-table-cell--header]': 'header()'
  }
})
export class JbhTableCellComponent {
  readonly header = input(false, { transform: booleanAttribute });
}
