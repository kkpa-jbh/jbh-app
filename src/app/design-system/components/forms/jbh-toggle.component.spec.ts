import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { JbhToggleComponent } from './jbh-toggle.component';

@Component({
  standalone: true,
  imports: [JbhToggleComponent],
  template: `<jbh-toggle label="Notifications" [(checked)]="on" [disabled]="off"></jbh-toggle>`
})
class HostComponent {
  readonly on = signal(true);
  off = false;
}

type ToggleElement = HTMLElement & { checked: boolean; disabled: boolean };

describe('JbhToggleComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideIonicAngular()] });
  });

  function setup(): ComponentFixture<HostComponent> {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  const toggleOf = (fixture: ComponentFixture<unknown>): ToggleElement =>
    (fixture.nativeElement as HTMLElement).querySelector('ion-toggle') as ToggleElement;

  const component = (fixture: ComponentFixture<unknown>): JbhToggleComponent =>
    fixture.debugElement.query(By.directive(JbhToggleComponent)).componentInstance;

  // A real DOM event, because Ionic's own ionChange listener on the element reads event.target.
  const change = (fixture: ComponentFixture<unknown>, checked: boolean): void => {
    toggleOf(fixture).dispatchEvent(new CustomEvent('ionChange', { detail: { checked } }));
    fixture.detectChanges();
  };

  it('shows the label text', () => {
    expect(toggleOf(setup()).textContent?.trim()).toBe('Notifications');
  });

  it('checks the inner toggle for a value written by the form', () => {
    const fixture = setup();
    component(fixture).writeValue(false);
    fixture.detectChanges();
    expect(toggleOf(fixture).checked).toBeFalse();

    component(fixture).writeValue(true);
    fixture.detectChanges();
    expect(toggleOf(fixture).checked).toBeTrue();
  });

  it('emits checkedChange outside a form', () => {
    const fixture = setup();

    change(fixture, false);

    expect(fixture.componentInstance.on()).toBeFalse();
  });

  it('calls the form change callback when the user switches', () => {
    const fixture = setup();
    const onChange = jasmine.createSpy('onChange');
    component(fixture).registerOnChange(onChange);

    change(fixture, false);

    expect(onChange).toHaveBeenCalledOnceWith(false);
  });

  it('ignores an event that repeats the current value', () => {
    const fixture = setup();
    const onChange = jasmine.createSpy('onChange');
    component(fixture).registerOnChange(onChange);

    change(fixture, true);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls the touched callback on blur', () => {
    const fixture = setup();
    const onTouched = jasmine.createSpy('onTouched');
    component(fixture).registerOnTouched(onTouched);

    toggleOf(fixture).dispatchEvent(new CustomEvent('ionBlur'));

    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('disables the inner toggle from the disabled input', () => {
    const fixture = setup();
    fixture.componentInstance.off = true;
    fixture.detectChanges();

    expect(toggleOf(fixture).disabled).toBeTrue();
  });

  it('disables the inner toggle when the form disables the control', () => {
    const fixture = setup();
    component(fixture).setDisabledState(true);
    fixture.detectChanges();

    expect(toggleOf(fixture).disabled).toBeTrue();
  });
});
