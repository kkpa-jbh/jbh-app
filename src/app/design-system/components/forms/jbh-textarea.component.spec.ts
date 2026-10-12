import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { JbhTextareaComponent } from './jbh-textarea.component';

describe('JbhTextareaComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [JbhTextareaComponent, TranslateModule.forRoot()],
      providers: [provideIonicAngular()]
    });
  });

  function create(inputs: Record<string, unknown> = {}): ComponentFixture<JbhTextareaComponent> {
    const fixture = TestBed.createComponent(JbhTextareaComponent);
    Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
    fixture.detectChanges();
    return fixture;
  }

  // A real DOM event, because Ionic's own listeners on the element read event.target.
  const textareaOf = (fixture: ComponentFixture<unknown>): HTMLElement =>
    (fixture.nativeElement as HTMLElement).querySelector('ion-textarea')!;

  it('shows the counter with the length and the limit', () => {
    const fixture = create({ maxlength: 500 });
    fixture.componentInstance.writeValue('abc');
    fixture.detectChanges();

    const counter = (fixture.nativeElement as HTMLElement).querySelector('.jbh-textarea__counter');
    expect(counter?.textContent?.trim().startsWith('3/500')).toBeTrue();
    expect(counter?.textContent).toContain('common.characters');
  });

  it('reads maxlength from a static attribute string', () => {
    const fixture = create({ maxlength: '120' });

    expect((fixture.nativeElement as HTMLElement).querySelector('.jbh-textarea__counter')?.textContent).toContain('0/120');
  });

  it('shows no counter without maxlength', () => {
    const fixture = create();

    expect((fixture.nativeElement as HTMLElement).querySelector('.jbh-textarea__counter')).toBeNull();
  });

  it('calls the change callback on ionInput', () => {
    const fixture = create();
    const onChange = jasmine.createSpy('onChange');
    fixture.componentInstance.registerOnChange(onChange);

    textareaOf(fixture).dispatchEvent(new CustomEvent('ionInput', { detail: { value: 'hello' } }));

    expect(onChange).toHaveBeenCalledOnceWith('hello');
  });

  it('calls the touched callback on ionBlur', () => {
    const fixture = create();
    const onTouched = jasmine.createSpy('onTouched');
    fixture.componentInstance.registerOnTouched(onTouched);

    textareaOf(fixture).dispatchEvent(new CustomEvent('ionBlur'));

    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('passes the written value, rows and auto-grow to ion-textarea', () => {
    const fixture = create({ rows: 5 });
    fixture.componentInstance.writeValue('abc');
    fixture.detectChanges();
    const textarea = textareaOf(fixture) as HTMLElement & { value: string; rows: number; autoGrow: boolean };

    expect(textarea.value).toBe('abc');
    expect(textarea.rows).toBe(5);
    expect(textarea.autoGrow).toBeTrue();
  });

  it('disables ion-textarea when the form disables the control', () => {
    const fixture = create();
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();

    expect((textareaOf(fixture) as HTMLElement & { disabled: boolean }).disabled).toBeTrue();
  });

  it('marks the control invalid and links its label when an error shows', () => {
    const fixture = create({ label: 'Notes', error: 'Too long' });
    const textarea = textareaOf(fixture);

    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.getAttribute('aria-describedby')).toContain('-error');
    const labelId = (fixture.nativeElement as HTMLElement).querySelector('label')?.id;
    expect(labelId).toBeTruthy();
    expect(textarea.getAttribute('aria-labelledby')).toBe(labelId ?? null);
  });
});
