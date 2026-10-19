import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { Color, LegendPosition, LineChartModule, ScaleType } from '@swimlane/ngx-charts';
import type { JbhChartResult } from './jbh-line-chart.component';

/**
 * Internal to the layer. The only file that imports ngx-charts, so `jbh-line-chart` can load it
 * with `@defer` and keep ngx-charts out of the start bundle.
 */
@Component({
  selector: 'jbh-line-chart-plot',
  standalone: true,
  imports: [LineChartModule],
  templateUrl: './jbh-line-chart-plot.component.html',
  styleUrls: ['./jbh-line-chart-plot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JbhLineChartPlotComponent {
  readonly results = input.required<JbhChartResult[]>();
  readonly showLegend = input(false, { transform: booleanAttribute });
  readonly valueFormatter = input<(value: number) => string>();

  protected readonly legendPosition = LegendPosition.Below;

  /** Hex values, because SVG attributes set by the chart cannot read CSS variables. */
  protected readonly colorScheme: Color = {
    name: 'jbh',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#667eea', '#764ba2', '#48bb78', '#4299e1']
  };
}
