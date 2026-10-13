import { Component } from '@angular/core';
import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LineChartComponent } from '@swimlane/ngx-charts';
import { JbhChartSeries, JbhLineChartComponent } from './jbh-line-chart.component';

@Component({
  standalone: true,
  imports: [JbhLineChartComponent],
  template: `<jbh-line-chart [series]="series" [valueFormatter]="format" [showLegend]="true"></jbh-line-chart>`
})
class HostComponent {
  readonly series: JbhChartSeries[] = [
    {
      name: 'Balance',
      points: [
        { label: 'Jan 2025', value: 1000 },
        { label: 'Feb 2025', value: 1234.56 }
      ]
    }
  ];
  readonly format = (value: number): string => 'X' + value;
}

describe('JbhLineChartComponent', () => {
  async function setup(): Promise<LineChartComponent> {
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations()],
      deferBlockBehavior: DeferBlockBehavior.Manual
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const [chartBlock] = await fixture.getDeferBlocks();
    await chartBlock.render(DeferBlockState.Complete);
    return fixture.debugElement.query(By.directive(LineChartComponent)).componentInstance as LineChartComponent;
  }

  it('renders the chart with animations off', async () => {
    const chart = await setup();

    expect(chart.animations).toBeFalse();
  });

  it('maps points to the chart data format', async () => {
    const chart = await setup();

    expect(chart.results).toEqual([
      {
        name: 'Balance',
        series: [
          { name: 'Jan 2025', value: 1000 },
          { name: 'Feb 2025', value: 1234.56 }
        ]
      }
    ]);
  });

  it('formats the value axis with valueFormatter', async () => {
    const chart = await setup();

    expect(chart.yAxisTickFormatting(1234.56)).toBe('X1234.56');
  });

  it('shows the legend when asked', async () => {
    const chart = await setup();

    expect(chart.legend).toBeTrue();
  });
});
