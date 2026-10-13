import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { JbhDateFieldComponent } from './jbh-date-field.component';

type DatetimeElement = HTMLElement & { value: string | null; presentation: string; min?: string; max?: string };

describe('JbhDateFieldComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [JbhDateFieldComponent, TranslateModule.forRoot()],
      providers: [provideIonicAngular()]
    });
  });

  function create(inputs: Record<string, unknown> = {}): ComponentFixture<JbhDateFieldComponent> {
    const fixture = TestBed.createComponent(JbhDateFieldComponent);
    Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
    fixture.detectChanges();
    // The modal renders its template after its inputs are set, so a second pass shows the picker.
    fixture.detectChanges();
    return fixture;
  }

  const pickerOf = (fixture: ComponentFixture<unknown>): DatetimeElement =>
    (fixture.nativeElement as HTMLElement).querySelector('ion-datetime') as DatetimeElement;

  // A real DOM event, because Ionic's own ionChange listener on the element reads event.target.
  function pick(fixture: ComponentFixture<unknown>, value: string): void {
    pickerOf(fixture).dispatchEvent(new CustomEvent('ionChange', { detail: { value } }));
    fixture.detectChanges();
  }

  it('shows the value written by the form in the picker', () => {
    const fixture = create();
    fixture.componentInstance.writeValue('2025-10-11');
    fixture.detectChanges();

    expect(pickerOf(fixture).value).toBe('2025-10-11');
  });

  it('cuts the picked value to YYYY-MM-DD in date mode', () => {
    const fixture = create({ mode: 'date' });
    const onChange = jasmine.createSpy('onChange');
    fixture.componentInstance.registerOnChange(onChange);

    pick(fixture, '2025-10-12T09:30:00');

    expect(onChange).toHaveBeenCalledOnceWith('2025-10-12');
  });

  it('cuts the picked value to YYYY-MM in month mode and uses the month-year picker', () => {
    const fixture = create({ mode: 'month' });
    const onChange = jasmine.createSpy('onChange');
    fixture.componentInstance.registerOnChange(onChange);

    pick(fixture, '2025-03-01T00:00:00');

    expect(onChange).toHaveBeenCalledOnceWith('2025-03');
    expect(pickerOf(fixture).presentation).toBe('month-year');
  });

  it('uses the calendar picker in date mode', () => {
    expect(pickerOf(create()).presentation).toBe('date');
  });

  it('does not report a value that equals the one written by the form', () => {
    const fixture = create();
    const onChange = jasmine.createSpy('onChange');
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.writeValue('2025-10-11');

    pick(fixture, '2025-10-11T00:00:00');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('gives each instance its own picker id and links its trigger to it', () => {
    const first = create();
    const second = create();
    const firstTrigger = (first.nativeElement as HTMLElement).querySelector('ion-datetime-button') as HTMLElement & {
      datetime: string;
    };
    const secondTrigger = (second.nativeElement as HTMLElement).querySelector('ion-datetime-button') as HTMLElement & {
      datetime: string;
    };

    expect(pickerOf(first).id).not.toBe(pickerOf(second).id);
    expect(firstTrigger.datetime).toBe(pickerOf(first).id);
    expect(secondTrigger.datetime).toBe(pickerOf(second).id);
  });

  it('passes min and max to the picker', () => {
    const fixture = create({ min: '2025-01-01', max: '2025-12-31' });

    expect(pickerOf(fixture).min).toBe('2025-01-01');
    expect(pickerOf(fixture).max).toBe('2025-12-31');
  });

  it('calls the touched callback when the picker closes', () => {
    const fixture = create();
    const onTouched = jasmine.createSpy('onTouched');
    fixture.componentInstance.registerOnTouched(onTouched);

    (fixture.nativeElement as HTMLElement)
      .querySelector('ion-modal')!
      .dispatchEvent(new CustomEvent('ionModalDidDismiss'));

    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('labels the trigger by the label element', () => {
    const fixture = create({ label: 'Date', error: 'Required' });
    const host: HTMLElement = fixture.nativeElement;
    const trigger = host.querySelector('ion-datetime-button')!;

    expect(trigger.getAttribute('aria-labelledby')).toBe(host.querySelector('label')!.id);
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-describedby')).toContain('-error');
  });
});
