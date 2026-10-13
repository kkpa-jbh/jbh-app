import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { JbhCardComponent } from './jbh-card.component';

@Component({
  standalone: true,
  imports: [JbhCardComponent],
  template: `
    <jbh-card id="elevated" variant="elevated"><p class="inside">Hello</p></jbh-card>
    <jbh-card id="default">Plain</jbh-card>
  `
})
class HostComponent {}

describe('JbhCardComponent', () => {
  function setup(): HTMLElement {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('adds the variant class and shows the projected content', () => {
    const root = setup();
    const card = root.querySelector('#elevated')!;

    expect(card.classList).toContain('jbh-card--elevated');
    expect(card.querySelector('.inside')?.textContent).toBe('Hello');
  });

  it('uses the default variant when none is given', () => {
    const root = setup();

    expect(root.querySelector('#default')!.classList).toContain('jbh-card--default');
  });
});
