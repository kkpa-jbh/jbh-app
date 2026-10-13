import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { JbhLineChartPlotComponent } from './jbh-line-chart-plot.component';

export interface JbhChartPoint {
  label: string;
  value: number;
}

export interface JbhChartSeries {
  name: string;
  points: readonly JbhChartPoint[];
}

/** The data shape ngx-charts reads. */
export interface JbhChartResult {
  name: string;
  series: { name: string; value: number }[];
}

/**
 * Line chart with both axes. Animations are always off: ngx-charts animates `strokeDashoffset`,
 * which Angular animations do not support. The chart fills the height of this element.
 * The chart code loads in its own chunk, so pages without a chart do not download it.
 */
@Component({
  selector: 'jbh-line-chart',
  standalone: true,
  imports: [JbhLineChartPlotComponent],
  templateUrl: './jbh-line-chart.component.html',
  styleUrls: ['./jbh-line-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JbhLineChartComponent {
  readonly series = input.required<readonly JbhChartSeries[]>();
  readonly showLegend = input(false, { transform: booleanAttribute });
  /** Formats the ticks of the value axis. Without it the chart uses its own number format. */
  readonly valueFormatter = input<(value: number) => string>();

  protected readonly results = computed((): JbhChartResult[] =>
    this.series().map(series => ({
      name: series.name,
      series: series.points.map(point => ({ name: point.label, value: point.value }))
    }))
  );
}
