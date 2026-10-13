import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { JbhNavItemComponent } from './jbh-nav-item.component';

@Component({
  standalone: true,
  imports: [JbhNavItemComponent],
  template: `
    <jbh-nav-item
      id="item"
      icon="home-outline"
      [level]="2"
      [active]="true"
      [expanded]="expanded()"
      (activate)="clicks = clicks + 1"
    >
      Home
      <span jbhNavItemEnd class="badge">New</span>
    </jbh-nav-item>
  `
})
class HostComponent {
  readonly expanded = signal<boolean | null>(null);
  clicks = 0;
}

describe('JbhNavItemComponent', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideIonicAngular()] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const item: HTMLElement = fixture.nativeElement.querySelector('#item');
    return { fixture, item };
  }

  function chevronNames(item: HTMLElement): string[] {
    return Array.from(item.querySelectorAll<HTMLElement & { name: string }>('.jbh-nav-item__chevron ion-icon')).map(
      icon => icon.name
    );
  }

  it('adds the level and active classes', () => {
    const { item } = setup();

    expect(item.classList).toContain('jbh-nav-item--level-2');
    expect(item.classList).toContain('jbh-nav-item--active');
  });

  it('emits activate once per click', () => {
    const { fixture, item } = setup();

    item.click();

    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('shows the projected label and the end content', () => {
    const { item } = setup();

    expect(item.textContent).toContain('Home');
    expect(item.querySelector('.badge')?.textContent).toBe('New');
  });

  it('shows no chevron when expanded is null', () => {
    const { item } = setup();

    expect(item.querySelector('.jbh-nav-item__chevron')).toBeNull();
  });

  it('shows chevron-up when expanded and chevron-down when collapsed', () => {
    const { fixture, item } = setup();

    fixture.componentInstance.expanded.set(true);
    fixture.detectChanges();
    expect(chevronNames(item)).toEqual(['chevron-up-outline']);

    fixture.componentInstance.expanded.set(false);
    fixture.detectChanges();
    expect(chevronNames(item)).toEqual(['chevron-down-outline']);
  });
});
