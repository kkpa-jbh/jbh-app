import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { JbhButtonComponent } from './jbh-button.component';

@Component({
  standalone: true,
  imports: [JbhButtonComponent, ReactiveFormsModule],
  template: `
    <button id="secondary" jbhButton="secondary" block>Save</button>
    <button id="default" jbhButton>Go</button>
    <button id="loading" jbhButton icon="save-outline" [loading]="loading()">Save</button>
    <a id="link" jbhButton="outline" href="#">Link</a>
    <label id="label" jbhButton="secondary" for="file">Pick</label>
    <form [formGroup]="form" (ngSubmit)="submitted = submitted + 1">
      <button id="submit" jbhButton type="submit">Send</button>
    </form>
  `
})
class HostComponent {
  readonly loading = signal(false);
  readonly form = new FormGroup({ name: new FormControl('') });
  submitted = 0;
}

describe('JbhButtonComponent', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [HostComponent, TranslateModule.forRoot()],
      providers: [provideIonicAngular()]
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    return { fixture, root, el: (id: string) => root.querySelector<HTMLElement>(`#${id}`)! };
  }

  it('adds the variant and block classes', () => {
    const { el } = setup();

    expect(el('secondary').classList).toContain('jbh-button--secondary');
    expect(el('secondary').classList).toContain('jbh-button--block');
    expect(el('secondary').classList).toContain('jbh-button');
  });

  it('uses primary when the variant is empty', () => {
    const { el } = setup();

    expect(el('default').classList).toContain('jbh-button--primary');
    expect(el('default').classList).not.toContain('jbh-button--block');
  });

  it('shows one spinner, no icon and aria-busy while loading', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const button = el('loading');

    expect(button.querySelectorAll('jbh-spinner').length).toBe(1);
    expect(button.querySelectorAll('jbh-icon').length).toBe(0);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.classList).toContain('jbh-button--loading');
  });

  it('shows the icon and no aria-busy when not loading', () => {
    const { el } = setup();
    const button = el('loading');
    const icon = button.querySelector('jbh-icon ion-icon') as (HTMLElement & { name: string }) | null;

    expect(button.querySelectorAll('jbh-spinner').length).toBe(0);
    expect(icon?.name).toBe('save-outline');
    expect(button.hasAttribute('aria-busy')).toBeFalse();
  });

  it('projects the label text', () => {
    const { el } = setup();

    expect(el('default').textContent).toContain('Go');
  });

  it('works on an anchor and on a label', () => {
    const { el } = setup();

    expect(el('link').classList).toContain('jbh-button--outline');
    expect(el('label').classList).toContain('jbh-button--secondary');
  });

  it('keeps native submit: a click in a reactive form fires ngSubmit once', () => {
    const { fixture, el } = setup();

    el('submit').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.submitted).toBe(1);
  });
});
