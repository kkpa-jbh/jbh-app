import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TrackByFunction, computed, contentChild, input } from '@angular/core';
import { JbhTableCardDirective, JbhTableHeadDirective, JbhTableRowDirective } from './jbh-table-templates';

const identityTrackBy: TrackByFunction<any> = (_index, row) => row;

/**
 * Table driven by templates: one `jbhTableHead`, one `jbhTableRow` and an optional `jbhTableCard`.
 * With a card template the rows show as cards below 768 px.
 */
@Component({
  selector: 'jbh-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './jbh-table.component.html',
  styleUrls: ['./jbh-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.jbh-table--has-cards]': 'hasCards()' }
})
export class JbhTableComponent {
  readonly rows = input.required<readonly unknown[]>();
  readonly trackBy = input<TrackByFunction<any>>(identityTrackBy);
  /** Accessible name of the table. */
  readonly label = input<string>();

  protected readonly head = contentChild.required(JbhTableHeadDirective);
  protected readonly rowTemplate = contentChild.required(JbhTableRowDirective);
  protected readonly cardTemplate = contentChild(JbhTableCardDirective);
  protected readonly hasCards = computed(() => !!this.cardTemplate());
}
