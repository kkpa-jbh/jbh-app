import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
  function setup(): LineChartComponent {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.debugElement.query(By.directive(LineChartComponent)).componentInstance as LineChartComponent;
  }

  it('renders the chart with animations off', () => {
    const chart = setup();

    expect(chart.animations).toBeFalse();
  });

  it('maps points to the chart data format', () => {
    const chart = setup();

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

  it('formats the value axis with valueFormatter', () => {
    const chart = setup();

    expect(chart.yAxisTickFormatting(1234.56)).toBe('X1234.56');
  });

  it('shows the legend when asked', () => {
    const chart = setup();

    expect(chart.legend).toBeTrue();
  });
});
