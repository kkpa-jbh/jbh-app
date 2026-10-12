import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { JbhViewportService } from '@design-system/platform/viewport';
import { JbhSelectOptionComponent } from './jbh-select-option.component';
import { JbhSelectComponent } from './jbh-select.component';

@Component({
  standalone: true,
  imports: [JbhSelectComponent, JbhSelectOptionComponent],
  template: `
    <jbh-select [label]="label" [loading]="loading" [error]="error">
      <jbh-select-option value="A">Option A</jbh-select-option>
      <jbh-select-option value="B">Option B</jbh-select-option>
      <jbh-select-option value="C">Option C</jbh-select-option>
    </jbh-select>
  `
})
class HostComponent {
  label: string | undefined = undefined;
  loading = false;
  error: string | null = null;
}

type SelectElement = HTMLElement & {
  interface: string;
  interfaceOptions: { header?: string };
  disabled: boolean;
};

describe('JbhSelectComponent', () => {
  const wide = signal(false);

  beforeEach(() => {
    wide.set(false);
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [provideIonicAngular(), { provide: JbhViewportService, useValue: { wide } }]
    });
  });

  function setup(patch: Partial<HostComponent> = {}): ComponentFixture<HostComponent> {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, patch);
    fixture.detectChanges();
    return fixture;
  }

  const selectOf = (fixture: ComponentFixture<unknown>): SelectElement =>
    (fixture.nativeElement as HTMLElement).querySelector('ion-select') as SelectElement;

  const selectComponent = (fixture: ComponentFixture<unknown>): JbhSelectComponent =>
    fixture.debugElement.query(By.directive(JbhSelectComponent)).componentInstance;

  it('renders the projected options with their values and labels', () => {
    const fixture = setup();
    const options = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('ion-select-option')) as Array<
      HTMLElement & { value: string }
    >;

    expect(options.map(o => o.value)).toEqual(['A', 'B', 'C']);
    expect(options.map(o => o.textContent?.trim())).toEqual(['Option A', 'Option B', 'Option C']);
  });

  it('reports the picked value and marks the control as touched', () => {
    const fixture = setup();
    const component = selectComponent(fixture);
    const onChange = jasmine.createSpy('onChange');
    const onTouched = jasmine.createSpy('onTouched');
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    selectOf(fixture).dispatchEvent(new CustomEvent('ionChange', { detail: { value: 'B' } }));

    expect(onChange).toHaveBeenCalledOnceWith('B');
    expect(onTouched).toHaveBeenCalled();
  });

  it('marks the control as touched when the overlay closes', () => {
    const fixture = setup();
    const onTouched = jasmine.createSpy('onTouched');
    selectComponent(fixture).registerOnTouched(onTouched);

    selectOf(fixture).dispatchEvent(new CustomEvent('ionDismiss'));

    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('does not report a value that equals the one written by the form', () => {
    const fixture = setup();
    const component = selectComponent(fixture);
    const onChange = jasmine.createSpy('onChange');
    component.registerOnChange(onChange);
    component.writeValue('A');

    selectOf(fixture).dispatchEvent(new CustomEvent('ionChange', { detail: { value: 'A' } }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses an action sheet on narrow screens and a popover on wide ones', () => {
    const fixture = setup();
    expect(selectOf(fixture).interface).toBe('action-sheet');

    wide.set(true);
    fixture.detectChanges();
    expect(selectOf(fixture).interface).toBe('popover');
  });

  it('uses the label as the overlay header', () => {
    const fixture = setup({ label: 'Team' });

    expect(selectOf(fixture).interfaceOptions.header).toBe('Team');
  });

  it('shows a spinner and disables the select while loading', () => {
    const fixture = setup({ loading: true });

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('jbh-spinner').length).toBe(1);
    expect(selectOf(fixture).disabled).toBeTrue();
  });

  it('shows no spinner and keeps the select enabled when not loading', () => {
    const fixture = setup();

    expect((fixture.nativeElement as HTMLElement).querySelector('jbh-spinner')).toBeNull();
    expect(selectOf(fixture).disabled).toBeFalse();
  });

  it('disables the select when the form disables the control', () => {
    const fixture = setup();
    selectComponent(fixture).setDisabledState(true);
    fixture.detectChanges();

    expect(selectOf(fixture).disabled).toBeTrue();
  });

  it('shows the error text and marks the select invalid', () => {
    const fixture = setup({ label: 'Team', error: 'Pick one' });

    expect((fixture.nativeElement as HTMLElement).querySelector('.jbh-field__error')?.textContent).toContain('Pick one');
    expect(selectOf(fixture).getAttribute('aria-invalid')).toBe('true');
  });
});
