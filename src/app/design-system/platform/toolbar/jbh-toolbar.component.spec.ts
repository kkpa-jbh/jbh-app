import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { JbhToolbarAction, JbhToolbarComponent } from './jbh-toolbar.component';

@Component({
  standalone: true,
  imports: [JbhToolbarComponent],
  template: `<jbh-toolbar title="Teams" [back]="back()" [backHref]="backHref" [actions]="actions"></jbh-toolbar>`
})
class HostComponent {
  readonly back = signal(false);
  readonly backHref = '/x';
  readonly handler = jasmine.createSpy('handler');
  readonly actions: JbhToolbarAction[] = [{ id: 'refresh', icon: 'refresh-outline', handler: this.handler }];
}

describe('JbhToolbarComponent', () => {
  function setup(back: boolean) {
    TestBed.configureTestingModule({ providers: [provideIonicAngular()] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.back.set(back);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the back button with the fallback href and no menu button when back is true', () => {
    const fixture = setup(true);
    const root: HTMLElement = fixture.nativeElement;
    const backButton = root.querySelector('ion-back-button') as (HTMLElement & { defaultHref?: string }) | null;

    expect(backButton).not.toBeNull();
    expect(backButton!.defaultHref).toBe('/x');
    expect(root.querySelector('ion-menu-button')).toBeNull();
  });

  it('shows the menu button and no back button when back is false', () => {
    const fixture = setup(false);
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('ion-menu-button')).not.toBeNull();
    expect(root.querySelector('ion-back-button')).toBeNull();
  });

  it('shows the title text', () => {
    const fixture = setup(false);

    expect(fixture.nativeElement.querySelector('ion-title').textContent.trim()).toBe('Teams');
  });

  it('runs the action handler once on click and names the button after the id', () => {
    const fixture = setup(false);
    const button: HTMLElement = fixture.nativeElement.querySelector('ion-buttons[slot="end"] ion-button');

    button.click();

    expect(fixture.componentInstance.handler).toHaveBeenCalledTimes(1);
    expect(button.getAttribute('aria-label')).toBe('refresh');
  });

  it('does not show a native tooltip for the static title', () => {
    const fixture = setup(false);

    expect((fixture.nativeElement.querySelector('jbh-toolbar') as HTMLElement).hasAttribute('title')).toBeFalse();
  });
});
