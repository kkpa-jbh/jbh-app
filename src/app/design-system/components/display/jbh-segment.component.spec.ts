import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { JbhSegmentComponent, JbhSegmentOption } from './jbh-segment.component';

@Component({
  standalone: true,
  imports: [JbhSegmentComponent],
  template: `<jbh-segment [options]="options" [(value)]="selected" label="Type"></jbh-segment>`
})
class HostComponent {
  readonly options: JbhSegmentOption[] = [
    { value: 'INCOME', label: 'Income', icon: 'trending-up-outline' },
    { value: 'EXPENSE', label: 'Expense' }
  ];
  readonly selected = signal('INCOME');
}

// A real DOM event, because Ionic's own ionChange listener on the segment reads event.target.
function dispatchIonChange(root: HTMLElement, detail: { value?: string }): void {
  root.querySelector('ion-segment')!.dispatchEvent(new CustomEvent('ionChange', { detail }));
}

describe('JbhSegmentComponent', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideIonicAngular()] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders one segment button per option as a direct child of the segment', () => {
    const fixture = setup();
    const segment: HTMLElement = fixture.nativeElement.querySelector('ion-segment');
    const buttons = Array.from(segment.children).filter(el => el.tagName === 'ION-SEGMENT-BUTTON');

    expect(buttons.length).toBe(2);
    expect(buttons.map(b => (b as HTMLElement & { value: string }).value)).toEqual(['INCOME', 'EXPENSE']);
  });

  it('shows the icon only for options that have one', () => {
    const fixture = setup();

    expect(fixture.nativeElement.querySelectorAll('jbh-icon').length).toBe(1);
  });

  it('gives the group an accessible name', () => {
    const fixture = setup();

    expect(fixture.nativeElement.querySelector('ion-segment').getAttribute('aria-label')).toBe('Type');
  });

  it('emits valueChange when the segment changes', () => {
    const fixture = setup();
    const emitted: string[] = [];
    const segment = fixture.debugElement.query(By.directive(JbhSegmentComponent)).componentInstance as JbhSegmentComponent;
    segment.value.subscribe(value => emitted.push(value));

    dispatchIonChange(fixture.nativeElement, { value: 'EXPENSE' });
    fixture.detectChanges();

    expect(emitted).toEqual(['EXPENSE']);
    expect(fixture.componentInstance.selected()).toBe('EXPENSE');
  });

  it('ignores a change without a value', () => {
    const fixture = setup();

    dispatchIonChange(fixture.nativeElement, {});
    fixture.detectChanges();

    expect(fixture.componentInstance.selected()).toBe('INCOME');
  });
});
