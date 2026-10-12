import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { JbhNumberFieldComponent } from './jbh-number-field.component';

describe('JbhNumberFieldComponent', () => {
  let changes: Array<number | null>;

  beforeEach(() => {
    changes = [];
    TestBed.configureTestingModule({
      imports: [JbhNumberFieldComponent, TranslateModule.forRoot()],
      providers: [provideIonicAngular()]
    });
  });

  function create(inputs: Record<string, unknown> = {}): ComponentFixture<JbhNumberFieldComponent> {
    const fixture = TestBed.createComponent(JbhNumberFieldComponent);
    Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
    fixture.componentInstance.registerOnChange(value => changes.push(value));
    fixture.detectChanges();
    return fixture;
  }

  const inputOf = (fixture: ComponentFixture<unknown>): HTMLInputElement =>
    (fixture.nativeElement as HTMLElement).querySelector('input')!;

  function type(fixture: ComponentFixture<unknown>, text: string): void {
    const input = inputOf(fixture);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('groups thousands on blur and reports the plain number', () => {
    const fixture = create();
    const input = inputOf(fixture);

    input.dispatchEvent(new Event('focus'));
    type(fixture, '1234.56');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(input.value).toBe('1,234.56');
    expect(changes[changes.length - 1]).toBe(1234.56);
  });

  it('rejects text with too many decimals and keeps the previous text', () => {
    const fixture = create({ decimals: 2 });
    type(fixture, '12.34');
    const reported = changes.length;

    type(fixture, '12.345');

    expect(inputOf(fixture).value).toBe('12.34');
    expect(changes.length).toBe(reported);
    expect(changes[changes.length - 1]).toBe(12.34);
  });

  it('rejects a decimal separator when decimals is 0', () => {
    const fixture = create({ decimals: 0 });
    type(fixture, '12');

    type(fixture, '12.5');

    expect(inputOf(fixture).value).toBe('12');
  });

  it('shows the written number grouped, and empty for null', () => {
    const fixture = create();

    fixture.componentInstance.writeValue(1234.5);
    fixture.detectChanges();
    expect(inputOf(fixture).value).toBe('1,234.5');

    fixture.componentInstance.writeValue(null);
    fixture.detectChanges();
    expect(inputOf(fixture).value).toBe('');
  });

  it('removes thousands separators on focus', () => {
    const fixture = create();
    fixture.componentInstance.writeValue(1234.5);
    fixture.detectChanges();

    inputOf(fixture).dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    expect(inputOf(fixture).value).toBe('1234.5');
  });

  it('does not report a number while the text ends with the decimal separator', () => {
    const fixture = create();

    type(fixture, '12.');

    expect(changes).toEqual([]);
  });

  it('does not mark an untouched written value as changed on blur', () => {
    const fixture = create();
    fixture.componentInstance.writeValue(10);
    fixture.detectChanges();
    const input = inputOf(fixture);

    input.dispatchEvent(new Event('focus'));
    input.dispatchEvent(new Event('blur'));

    expect(changes).toEqual([]);
  });

  it('reports null when the text is cleared', () => {
    const fixture = create();
    type(fixture, '5');

    type(fixture, '');

    expect(changes[changes.length - 1]).toBeNull();
  });

  it('calls the touched callback on blur', () => {
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

  it('uses the decimal input mode, and numeric for integers', () => {
    const decimal = create();
    const integer = create({ decimals: 0 });

    expect(inputOf(decimal).getAttribute('inputmode')).toBe('decimal');
    expect(inputOf(integer).getAttribute('inputmode')).toBe('numeric');
  });
});
