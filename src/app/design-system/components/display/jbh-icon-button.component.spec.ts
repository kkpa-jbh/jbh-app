import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { JbhIconButtonComponent } from './jbh-icon-button.component';

@Component({
  standalone: true,
  imports: [JbhIconButtonComponent],
  template: `
    <button id="danger" jbhIconButton="danger" icon="trash-outline" label="Delete"></button>
    <button id="small" jbhIconButton icon="close" label="Close" size="sm"></button>
  `
})
class HostComponent {}

describe('JbhIconButtonComponent', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideIonicAngular()]
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    return (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  }

  it('uses the label as aria-label and title and shows one icon', () => {
    const el = setup();
    const button = el('danger');

    expect(button.getAttribute('aria-label')).toBe('Delete');
    expect(button.getAttribute('title')).toBe('Delete');
    expect(button.classList).toContain('jbh-icon-button--danger');
    expect(button.querySelectorAll('jbh-icon').length).toBe(1);
  });

  it('defaults to the default tone and the md size, and takes the sm size', () => {
    const el = setup();

    expect(el('small').classList).toContain('jbh-icon-button--default');
    expect(el('small').classList).toContain('jbh-icon-button--sm');
    expect(el('danger').classList).toContain('jbh-icon-button--md');
  });
});
