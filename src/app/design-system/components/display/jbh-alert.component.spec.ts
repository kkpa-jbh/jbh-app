import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { JbhAlertComponent } from './jbh-alert.component';

@Component({
  standalone: true,
  imports: [JbhAlertComponent],
  template: `
    <jbh-alert id="error" tone="error">Wrong password</jbh-alert>
    <jbh-alert id="info" tone="info">Heads up</jbh-alert>
    <jbh-alert id="warning" tone="warning">Careful</jbh-alert>
    <jbh-alert id="success" tone="success">Done</jbh-alert>
  `
})
class HostComponent {}

describe('JbhAlertComponent', () => {
  function setup(): (id: string) => HTMLElement {
    TestBed.configureTestingModule({ providers: [provideIonicAngular()] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    return id => root.querySelector<HTMLElement>(`#${id}`)!;
  }

  it('uses role alert for error and shows the projected text', () => {
    const el = setup();

    expect(el('error').getAttribute('role')).toBe('alert');
    expect(el('error').textContent).toContain('Wrong password');
  });

  it('uses role status for the other tones', () => {
    const el = setup();

    ['info', 'warning', 'success'].forEach(id => expect(el(id).getAttribute('role')).withContext(id).toBe('status'));
  });

  it('adds the tone class and one icon per alert', () => {
    const el = setup();

    expect(el('warning').classList).toContain('jbh-alert--warning');
    expect(el('success').querySelectorAll('jbh-icon').length).toBe(1);
  });
});
