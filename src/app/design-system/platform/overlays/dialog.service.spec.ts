import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { DialogService } from './dialog.service';

@Component({ standalone: true, template: '' })
class SheetContentComponent {}

describe('DialogService', () => {
  let alertController: jasmine.SpyObj<AlertController>;
  let modalController: jasmine.SpyObj<ModalController>;
  let alert: { present: jasmine.Spy; onWillDismiss: jasmine.Spy };
  let modal: { present: jasmine.Spy };

  beforeEach(() => {
    alert = {
      present: jasmine.createSpy('present').and.resolveTo(),
      onWillDismiss: jasmine.createSpy('onWillDismiss').and.resolveTo({ role: 'cancel' })
    };
    modal = { present: jasmine.createSpy('present').and.resolveTo() };
    alertController = jasmine.createSpyObj<AlertController>('AlertController', ['create']);
    alertController.create.and.resolveTo(alert as never);
    modalController = jasmine.createSpyObj<ModalController>('ModalController', ['create', 'dismiss']);
    modalController.create.and.resolveTo(modal as never);
    modalController.dismiss.and.resolveTo(true);

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: AlertController, useValue: alertController },
        { provide: ModalController, useValue: modalController }
      ]
    });
  });

  it('creates an alert with a cancel button and a destructive confirm button', async () => {
    await TestBed.inject(DialogService).confirm({
      title: 'T',
      message: 'M',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true
    });

    expect(alertController.create).toHaveBeenCalledOnceWith({
      header: 'T',
      message: 'M',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive' }
      ]
    });
    expect(alert.present).toHaveBeenCalledTimes(1);
  });

  it('resolves true for confirm and destructive, false for cancel and backdrop', async () => {
    const service = TestBed.inject(DialogService);
    const cases = [
      { role: 'destructive', expected: true },
      { role: 'confirm', expected: true },
      { role: 'cancel', expected: false },
      { role: 'backdrop', expected: false }
    ];

    for (const { role, expected } of cases) {
      alert.onWillDismiss.and.resolveTo({ role });

      const result = await service.confirm({ title: 'T', message: 'M', confirmText: 'OK' });

      expect(result).withContext(role).toBe(expected);
    }
  });

  it('uses the translated common.cancel and the confirm role when cancelText and destructive are missing', async () => {
    await TestBed.inject(DialogService).confirm({ title: 'T', message: 'M', confirmText: 'OK' });

    const buttons = alertController.create.calls.mostRecent().args[0]?.buttons;
    expect(buttons).toEqual([
      { text: 'common.cancel', role: 'cancel' },
      { text: 'OK', role: 'confirm' }
    ]);
  });

  it('opens a component as a sheet with the breakpoints', async () => {
    await TestBed.inject(DialogService).open(SheetContentComponent, { sheet: true });

    expect(modalController.create).toHaveBeenCalledOnceWith({
      component: SheetContentComponent,
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });
    expect(modal.present).toHaveBeenCalledTimes(1);
  });

  it('opens a component without breakpoints when sheet is not set', async () => {
    await TestBed.inject(DialogService).open(SheetContentComponent);

    expect(modalController.create).toHaveBeenCalledOnceWith({ component: SheetContentComponent });
    expect(modal.present).toHaveBeenCalledTimes(1);
  });

  it('closes the top modal', async () => {
    await TestBed.inject(DialogService).close();

    expect(modalController.dismiss).toHaveBeenCalledTimes(1);
  });
});
