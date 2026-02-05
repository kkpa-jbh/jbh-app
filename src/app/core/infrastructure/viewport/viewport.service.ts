import { Injectable, OnDestroy } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, fromEvent, Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

export type SelectInterface = 'action-sheet' | 'popover' | 'alert';

@Injectable({
  providedIn: 'root'
})
export class ViewportService implements OnDestroy {

  private readonly DESKTOP_BREAKPOINT = 1024;

  private isDesktop$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  constructor(private platform: Platform) {
    this.checkViewport();
    this.setupResizeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get selectInterface(): SelectInterface {
    return this.isDesktop$.value ? 'popover' : 'action-sheet';
  }

  getSelectInterface$(): Observable<SelectInterface> {
    return new Observable<SelectInterface>(subscriber => {
      this.isDesktop$
        .pipe(takeUntil(this.destroy$))
        .subscribe(isDesktop => {
          subscriber.next(isDesktop ? 'popover' : 'action-sheet');
        });
    });
  }

  isDesktop(): boolean {
    return this.isDesktop$.value;
  }

  isMobile(): boolean {
    return this.platform.width() < 768;
  }

  isTablet(): boolean {
    const width = this.platform.width();
    return width >= 768 && width < this.DESKTOP_BREAKPOINT;
  }

  private checkViewport(): void {
    const isDesktop = this.platform.width() >= this.DESKTOP_BREAKPOINT;
    this.isDesktop$.next(isDesktop);
  }

  private setupResizeListener(): void {
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.checkViewport();
      });
  }
}
