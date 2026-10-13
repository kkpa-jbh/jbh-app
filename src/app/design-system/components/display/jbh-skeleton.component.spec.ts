import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { JbhSkeletonComponent } from './jbh-skeleton.component';

@Component({
  standalone: true,
  imports: [JbhSkeletonComponent],
  template: `
    <jbh-skeleton id="sized" shape="input" width="60%" height="20px"></jbh-skeleton>
    <jbh-skeleton id="plain"></jbh-skeleton>
  `
})
class HostComponent {}

describe('JbhSkeletonComponent', () => {
  function setup(): (id: string) => HTMLElement {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    return id => root.querySelector<HTMLElement>(`#${id}`)!;
  }

  it('adds the shape class, the inline size and aria-hidden', () => {
    const el = setup();
    const skeleton = el('sized');

    expect(skeleton.classList).toContain('jbh-skeleton--input');
    expect(skeleton.style.width).toBe('60%');
    expect(skeleton.style.height).toBe('20px');
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses the line shape and no inline size by default', () => {
    const el = setup();
    const skeleton = el('plain');

    expect(skeleton.classList).toContain('jbh-skeleton--line');
    expect(skeleton.style.width).toBe('');
    expect(skeleton.style.height).toBe('');
  });
});
