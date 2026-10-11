import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { Color, LegendPosition, LineChartModule, ScaleType } from '@swimlane/ngx-charts';

export interface JbhChartPoint {
  label: string;
  value: number;
}

export interface JbhChartSeries {
  name: string;
  points: readonly JbhChartPoint[];
}

/**
 * Line chart with both axes. Animations are always off: ngx-charts animates `strokeDashoffset`,
 * which Angular animations do not support. The chart fills the height of this element.
 */
@Component({
  selector: 'jbh-line-chart',
  standalone: true,
  imports: [LineChartModule],
  templateUrl: './jbh-line-chart.component.html',
  styleUrls: ['./jbh-line-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JbhLineChartComponent {
  readonly series = input.required<readonly JbhChartSeries[]>();
  readonly showLegend = input(false, { transform: booleanAttribute });
  /** Formats the ticks of the value axis. Without it the chart uses its own number format. */
  readonly valueFormatter = input<(value: number) => string>();

  protected readonly results = computed(() =>
    this.series().map(series => ({
      name: series.name,
      series: series.points.map(point => ({ name: point.label, value: point.value }))
    }))
  );

  protected readonly legendPosition = LegendPosition.Below;

  /** Hex values, because SVG attributes set by the chart cannot read CSS variables. */
  protected readonly colorScheme: Color = {
    name: 'jbh',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#667eea', '#764ba2', '#48bb78', '#4299e1']
  };
}
