import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { LoggerService } from '@core/infrastructure/logging';
import { JbhIconComponent } from './jbh-icon.component';

describe('JbhIconComponent', () => {
  let logger: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    logger = jasmine.createSpyObj<LoggerService>('LoggerService', ['warn']);
    TestBed.configureTestingModule({
      imports: [JbhIconComponent],
      providers: [provideIonicAngular(), { provide: LoggerService, useValue: logger }]
    });
  });

  function createIcon(name: string, label?: string): ComponentFixture<JbhIconComponent> {
    const fixture = TestBed.createComponent(JbhIconComponent);
    fixture.componentRef.setInput('name', name);
    if (label !== undefined) {
      fixture.componentRef.setInput('label', label);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('renders one ion-icon with the given name and hides it from screen readers', () => {
    const fixture = createIcon('trash-outline');
    const host: HTMLElement = fixture.nativeElement;
    const icons = host.querySelectorAll('ion-icon');

    expect(icons.length).toBe(1);
    expect((icons[0] as HTMLElement & { name: string }).name).toBe('trash-outline');
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.getAttribute('role')).toBeNull();
  });

  it('exposes an accessible name when a label is given', () => {
    const fixture = createIcon('warning-outline', 'Warning');
    const host: HTMLElement = fixture.nativeElement;

    expect(host.getAttribute('role')).toBe('img');
    expect(host.getAttribute('aria-label')).toBe('Warning');
    expect(host.hasAttribute('aria-hidden')).toBeFalse();
  });

  it('renders nothing and warns once for an unknown name used by two instances', () => {
    const first = createIcon('not-an-icon');
    const second = createIcon('not-an-icon');

    expect((first.nativeElement as HTMLElement).querySelector('ion-icon')).toBeNull();
    expect((second.nativeElement as HTMLElement).querySelector('ion-icon')).toBeNull();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn.calls.mostRecent().args[0]).toContain('not-an-icon');
  });

  it('does not warn for a known name', () => {
    createIcon('trash-outline');

    expect(logger.warn).not.toHaveBeenCalled();
  });
});
