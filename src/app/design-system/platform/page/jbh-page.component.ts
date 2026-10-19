import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Renderer2, inject, output } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

/**
 * Root element of every routed page. Content marked `jbhPageHeader` goes above the scroll area.
 * Style it only with `--jbh-page-background`, `--jbh-page-padding-top` and `--jbh-page-padding-bottom`.
 */
@Component({
  selector: 'jbh-page',
  standalone: true,
  imports: [IonContent],
  templateUrl: './jbh-page.component.html',
  styleUrls: ['./jbh-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JbhPageComponent {
  /** The routed page is about to show, also when the router shows a cached page again. */
  readonly pageEnter = output<void>();
  /** The routed page is about to hide. */
  readonly pageLeave = output<void>();

  constructor() {
    // Ionic dispatches its page events on the routed page element, which is the parent of the
    // root `jbh-page`. Listening here, at creation, comes before the first transition fires them.
    const routedPage: HTMLElement | null = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.parentElement;
    if (!routedPage) return;

    const renderer = inject(Renderer2);
    const stopEnter = renderer.listen(routedPage, 'ionViewWillEnter', () => this.pageEnter.emit());
    const stopLeave = renderer.listen(routedPage, 'ionViewWillLeave', () => this.pageLeave.emit());

    inject(DestroyRef).onDestroy(() => {
      stopEnter();
      stopLeave();
    });
  }
}
