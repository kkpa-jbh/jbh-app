import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { JbhPageComponent } from './jbh-page.component';

@Component({
  standalone: true,
  imports: [JbhPageComponent],
  template: `
    <jbh-page (pageEnter)="enters = enters + 1" (pageLeave)="leaves = leaves + 1">
      <header class="header" jbhPageHeader>Header</header>
      <div class="body">Body</div>
    </jbh-page>
  `
})
class HostComponent {
  enters = 0;
  leaves = 0;
}

describe('JbhPageComponent', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideIonicAngular()] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('emits pageEnter when the parent element receives ionViewWillEnter', () => {
    const fixture = setup();

    fixture.nativeElement.dispatchEvent(new CustomEvent('ionViewWillEnter'));

    expect(fixture.componentInstance.enters).toBe(1);
  });

  it('emits pageEnter again on a second visit', () => {
    const fixture = setup();

    fixture.nativeElement.dispatchEvent(new CustomEvent('ionViewWillEnter'));
    fixture.nativeElement.dispatchEvent(new CustomEvent('ionViewWillEnter'));

    expect(fixture.componentInstance.enters).toBe(2);
  });

  it('emits pageLeave once when the parent element receives ionViewWillLeave', () => {
    const fixture = setup();

    fixture.nativeElement.dispatchEvent(new CustomEvent('ionViewWillLeave'));

    expect(fixture.componentInstance.leaves).toBe(1);
    expect(fixture.componentInstance.enters).toBe(0);
  });

  it('does not emit after it is destroyed', () => {
    const fixture = setup();
    const host: HTMLElement = fixture.nativeElement;
    const component = fixture.componentInstance;

    fixture.destroy();
    host.dispatchEvent(new CustomEvent('ionViewWillEnter'));
    host.dispatchEvent(new CustomEvent('ionViewWillLeave'));

    expect(component.enters).toBe(0);
    expect(component.leaves).toBe(0);
  });

  it('renders the header outside the scroll area and the other content inside it', () => {
    const fixture = setup();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('.header')).not.toBeNull();
    expect(root.querySelector('ion-content .header')).toBeNull();
    expect(root.querySelector('ion-content .body')).not.toBeNull();
  });
});
