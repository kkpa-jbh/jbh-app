import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { ToastService, ToastTone } from './toast.service';

describe('ToastService', () => {
  let toastController: jasmine.SpyObj<ToastController>;
  let toast: { present: jasmine.Spy };

  beforeEach(() => {
    toast = { present: jasmine.createSpy('present').and.resolveTo() };
    toastController = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
    toastController.create.and.resolveTo(toast as never);
    TestBed.configureTestingModule({ providers: [{ provide: ToastController, useValue: toastController }] });
  });

  it('creates a bottom toast of 3000 ms with a close button and presents it', async () => {
    await TestBed.inject(ToastService).show('Saved', 'success');

    expect(toastController.create).toHaveBeenCalledOnceWith({
      message: 'Saved',
      duration: 3000,
      position: 'bottom',
      color: 'success',
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    expect(toast.present).toHaveBeenCalledTimes(1);
  });

  it('maps tones to Ionic colors, with info as the default', async () => {
    const service = TestBed.inject(ToastService);
    const cases: { tone?: ToastTone; color: string }[] = [
      { tone: 'error', color: 'danger' },
      { tone: 'warning', color: 'warning' },
      { tone: 'info', color: 'medium' },
      { color: 'medium' }
    ];

    for (const { tone, color } of cases) {
      toastController.create.calls.reset();
      await service.show('M', tone);

      expect(toastController.create.calls.mostRecent().args[0]?.color).withContext(String(tone)).toBe(color);
    }
  });
});
