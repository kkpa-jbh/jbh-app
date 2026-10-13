import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { JbhViewportService } from './jbh-viewport.service';

describe('JbhViewportService', () => {
  let width: number;

  beforeEach(() => {
    width = 800;
    spyOnProperty(window, 'innerWidth', 'get').and.callFake(() => width);
  });

  it('reports wide from 1024 px', () => {
    [
      { innerWidth: 800, expected: false },
      { innerWidth: 1024, expected: true },
      { innerWidth: 1280, expected: true }
    ].forEach(({ innerWidth, expected }) => {
      TestBed.resetTestingModule();
      width = innerWidth;

      expect(TestBed.inject(JbhViewportService).wide()).withContext(`${innerWidth}px`).toBe(expected);
    });
  });

  it('updates 100 ms after a resize', fakeAsync(() => {
    const viewport = TestBed.inject(JbhViewportService);
    expect(viewport.wide()).toBeFalse();

    width = 1280;
    window.dispatchEvent(new Event('resize'));
    tick(99);
    expect(viewport.wide()).toBeFalse();

    tick(1);
    expect(viewport.wide()).toBeTrue();
  }));

  it('waits for the last of several resize events', fakeAsync(() => {
    const viewport = TestBed.inject(JbhViewportService);

    window.dispatchEvent(new Event('resize'));
    tick(60);
    width = 1280;
    window.dispatchEvent(new Event('resize'));
    tick(60);
    expect(viewport.wide()).toBeFalse();

    tick(40);
    expect(viewport.wide()).toBeTrue();
  }));

  it('stops listening when the injector is destroyed', fakeAsync(() => {
    const viewport = TestBed.inject(JbhViewportService);
    TestBed.resetTestingModule();

    width = 1280;
    window.dispatchEvent(new Event('resize'));
    tick(100);

    expect(viewport.wide()).toBeFalse();
  }));
});
