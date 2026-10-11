import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { JbhSpinnerComponent } from './jbh-spinner.component';

describe('JbhSpinnerComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [JbhSpinnerComponent, TranslateModule.forRoot()],
      providers: [provideIonicAngular()]
    });
  });

  it('has role status and the translated loading text as accessible name', () => {
    const fixture = TestBed.createComponent(JbhSpinnerComponent);
    fixture.detectChanges();
    const status: HTMLElement | null = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');

    expect(status).not.toBeNull();
    expect(status?.getAttribute('aria-label')).toBe('common.loading');
  });

  it('renders one ion-spinner', () => {
    const fixture = TestBed.createComponent(JbhSpinnerComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('ion-spinner').length).toBe(1);
  });
});
