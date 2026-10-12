import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { JbhTextFieldComponent } from './jbh-text-field.component';

describe('JbhTextFieldComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [JbhTextFieldComponent, TranslateModule.forRoot()],
      providers: [provideIonicAngular()]
    });
  });

  function create(inputs: Record<string, unknown> = {}): ComponentFixture<JbhTextFieldComponent> {
    const fixture = TestBed.createComponent(JbhTextFieldComponent);
    Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
    fixture.detectChanges();
    return fixture;
  }

  const inputOf = (fixture: ComponentFixture<unknown>): HTMLInputElement =>
    (fixture.nativeElement as HTMLElement).querySelector('input')!;

  it('gives each instance its own input id and points its label at it', () => {
    const first = create({ label: 'One' });
    const second = create({ label: 'Two' });
    const firstInput = inputOf(first);
    const secondInput = inputOf(second);

    expect(firstInput.id).not.toBe(secondInput.id);
    expect((first.nativeElement as HTMLElement).querySelector('label')?.getAttribute('for')).toBe(firstInput.id);
    expect((second.nativeElement as HTMLElement).querySelector('label')?.getAttribute('for')).toBe(secondInput.id);
  });

  it('shows the value written by the form', () => {
    const fixture = create();
    fixture.componentInstance.writeValue('abc');
    fixture.detectChanges();

    expect(inputOf(fixture).value).toBe('abc');
  });

  it('calls the change callback with the typed text', () => {
    const fixture = create();
    const onChange = jasmine.createSpy('onChange');
    fixture.componentInstance.registerOnChange(onChange);
    const input = inputOf(fixture);

    input.value = 'x';
    input.dispatchEvent(new Event('input'));

    expect(onChange).toHaveBeenCalledOnceWith('x');
  });

  it('calls the touched callback once on blur', () => {
    const fixture = create();
    const onTouched = jasmine.createSpy('onTouched');
    fixture.componentInstance.registerOnTouched(onTouched);

    inputOf(fixture).dispatchEvent(new Event('blur'));

    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('disables the native input when the form disables the control', () => {
    const fixture = create();
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();

    expect(inputOf(fixture).disabled).toBeTrue();
  });

  it('marks the input invalid and described by the error id when an error shows', () => {
    const fixture = create({ label: 'Name', error: 'Required' });
    const input = inputOf(fixture);

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(`${input.id}-error`);
    expect((fixture.nativeElement as HTMLElement).querySelector(`#${input.id}-error`)).not.toBeNull();
  });

  it('shows no error element and no aria-invalid for an empty error', () => {
    const fixture = create({ label: 'Name', error: '' });
    const input = inputOf(fixture);

    expect(input.getAttribute('aria-invalid')).not.toBe('true');
    expect((fixture.nativeElement as HTMLElement).querySelector('.jbh-field__error')).toBeNull();
  });

  it('sets aria-required for a required field', () => {
    const fixture = create({ label: 'Name', requirement: 'required' });

    expect(inputOf(fixture).getAttribute('aria-required')).toBe('true');
  });

  it('reveals and hides a password', () => {
    const fixture = create({ type: 'password' });
    const button: HTMLButtonElement = (fixture.nativeElement as HTMLElement).querySelector('button')!;

    expect(inputOf(fixture).type).toBe('password');
    expect(button.getAttribute('aria-label')).toBe('common.showPassword');

    button.click();
    fixture.detectChanges();
    expect(inputOf(fixture).type).toBe('text');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('common.hidePassword');

    button.click();
    fixture.detectChanges();
    expect(inputOf(fixture).type).toBe('password');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('has no reveal button for a text field', () => {
    const fixture = create({ type: 'text' });

    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });
});
