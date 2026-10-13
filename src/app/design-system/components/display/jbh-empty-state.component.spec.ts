import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { JbhEmptyStateComponent } from './jbh-empty-state.component';

@Component({
  standalone: true,
  imports: [JbhEmptyStateComponent],
  template: `
    <jbh-empty-state id="full" icon="list-outline" title="No data" message="Add one">
      <button class="action">Add</button>
    </jbh-empty-state>
    <jbh-empty-state id="bare" title="Nothing"></jbh-empty-state>
  `
})
class HostComponent {}

describe('JbhEmptyStateComponent', () => {
  function setup(): (id: string) => HTMLElement {
    TestBed.configureTestingModule({ providers: [provideIonicAngular()] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    return id => root.querySelector<HTMLElement>(`#${id}`)!;
  }

  it('has role status, shows title and message and keeps the projected button inside', () => {
    const el = setup();
    const state = el('full');

    expect(state.getAttribute('role')).toBe('status');
    expect(state.querySelector('h3')?.textContent).toBe('No data');
    expect(state.querySelector('p')?.textContent).toBe('Add one');
    expect(state.querySelector('button.action')).not.toBeNull();
    expect(state.querySelectorAll('jbh-icon').length).toBe(1);
  });

  it('does not show a native tooltip from the title attribute', () => {
    const el = setup();

    expect(el('full').hasAttribute('title')).toBeFalse();
  });

  it('omits the icon and the message when they are not given', () => {
    const el = setup();

    expect(el('bare').querySelector('jbh-icon')).toBeNull();
    expect(el('bare').querySelector('p')).toBeNull();
  });
});
