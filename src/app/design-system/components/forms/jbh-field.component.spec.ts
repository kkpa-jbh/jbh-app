import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { JbhFieldComponent } from './jbh-field.component';

describe('JbhFieldComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [JbhFieldComponent, TranslateModule.forRoot()],
      providers: [provideIonicAngular()]
    });
  });

  function create(inputs: Record<string, unknown>): ComponentFixture<JbhFieldComponent> {
    const fixture = TestBed.createComponent(JbhFieldComponent);
    Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
    fixture.detectChanges();
    return fixture;
  }

  it('links the label, error and hint to the control id', () => {
    const fixture = create({ label: 'Email', controlId: 'c1', error: 'Required', hint: 'We never share it' });
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('label[for="c1"]')?.textContent?.trim()).toBe('Email');
    const error = host.querySelector('#c1-error');
    expect(error?.getAttribute('role')).toBe('alert');
    expect(error?.textContent?.trim()).toBe('Required');
    expect(host.querySelector('#c1-hint')?.textContent?.trim()).toBe('We never share it');
  });

  it('shows a hidden asterisk for required', () => {
    const fixture = create({ label: 'Email', controlId: 'c1', requirement: 'required' });
    const marker = (fixture.nativeElement as HTMLElement).querySelector('.jbh-field__required');

    expect(marker?.textContent?.trim()).toBe('*');
    expect(marker?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the translated optional text for optional', () => {
    const fixture = create({ label: 'Email', controlId: 'c1', requirement: 'optional' });
    const marker = (fixture.nativeElement as HTMLElement).querySelector('.jbh-field__optional');

    expect(marker?.textContent?.trim()).toBe('common.optional');
    expect((fixture.nativeElement as HTMLElement).querySelector('.jbh-field__required')).toBeNull();
  });

  it('renders no error and no hint element when they are empty', () => {
    const fixture = create({ label: 'Email', controlId: 'c1', error: '' });
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('#c1-error')).toBeNull();
    expect(host.querySelector('#c1-hint')).toBeNull();
  });

  it('gives the label an id and no "for" when the control is not native', () => {
    const fixture = create({ label: 'Date', controlId: 'c2', native: false });
    const label = (fixture.nativeElement as HTMLElement).querySelector('label');

    expect(label?.getAttribute('id')).toBe('c2-label');
    expect(label?.hasAttribute('for')).toBeFalse();
  });
});
