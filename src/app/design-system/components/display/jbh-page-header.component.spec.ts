import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { JbhPageHeaderComponent } from './jbh-page-header.component';

@Component({
  standalone: true,
  imports: [JbhPageHeaderComponent],
  template: `
    <jbh-page-header id="form" icon="list-outline" title="Movements" subtitle="All" variant="form">
      <button class="action">New</button>
    </jbh-page-header>
    <jbh-page-header id="page" title="Plain"></jbh-page-header>
  `
})
class HostComponent {}

describe('JbhPageHeaderComponent', () => {
  function setup(): (id: string) => HTMLElement {
    TestBed.configureTestingModule({ providers: [provideIonicAngular()] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    return id => root.querySelector<HTMLElement>(`#${id}`)!;
  }

  it('shows the title as h1, the subtitle and the variant class', () => {
    const el = setup();
    const header = el('form');

    expect(header.querySelector('h1')?.textContent).toBe('Movements');
    expect(header.querySelector('p')?.textContent).toBe('All');
    expect(header.classList).toContain('jbh-page-header--form');
  });

  it('projects actions and shows the icon', () => {
    const el = setup();

    expect(el('form').querySelector('button.action')).not.toBeNull();
    expect(el('form').querySelectorAll('jbh-icon').length).toBe(1);
  });

  it('uses the page variant, no icon and no subtitle by default', () => {
    const el = setup();
    const header = el('page');

    expect(header.classList).toContain('jbh-page-header--page');
    expect(header.querySelector('jbh-icon')).toBeNull();
    expect(header.querySelector('p')).toBeNull();
  });

  it('does not show a native tooltip from the title attribute', () => {
    const el = setup();

    expect(el('form').hasAttribute('title')).toBeFalse();
  });
});
