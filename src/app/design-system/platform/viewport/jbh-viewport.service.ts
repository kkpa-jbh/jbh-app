import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, NgZone, Signal, inject, signal } from '@angular/core';

/** From this width (px) the layout counts as desktop, and selects open as popovers. */
export const WIDE_VIEWPORT_MIN_WIDTH = 1024;

const RESIZE_DEBOUNCE_MS = 100;

/** Tells whether the window is wide. Reads `window.innerWidth`, so it has no UI-library dependency. */
@Injectable({ providedIn: 'root' })
export class JbhViewportService {
  private readonly win = inject(DOCUMENT).defaultView;
  private readonly zone = inject(NgZone);
  private readonly wideState = signal(this.readWide());

  /** True when the viewport is at least 1024 px wide. Updates 100 ms after the last resize. */
  readonly wide: Signal<boolean> = this.wideState.asReadonly();

  constructor() {
    const win = this.win;
    if (!win) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onResize = (): void => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.zone.run(() => this.wideState.set(this.readWide()));
      }, RESIZE_DEBOUNCE_MS);
    };

    // Outside the zone, so each resize event does not trigger change detection by itself.
    this.zone.runOutsideAngular(() => win.addEventListener('resize', onResize));

    inject(DestroyRef).onDestroy(() => {
      win.removeEventListener('resize', onResize);
      clearTimeout(timer);
    });
  }

  private readWide(): boolean {
    return (this.win?.innerWidth ?? 0) >= WIDE_VIEWPORT_MIN_WIDTH;
  }
}
