import { TestBed } from '@angular/core/testing';
import { Platform } from '@ionic/angular/standalone';
import { IonicDevicePlatform } from './ionic-device-platform.service';

describe('IonicDevicePlatform', () => {
  function setup(active: string[]): IonicDevicePlatform {
    const platform = jasmine.createSpyObj<Platform>('Platform', ['is']);
    platform.is.and.callFake((name: string) => active.includes(name));
    TestBed.configureTestingModule({ providers: [{ provide: Platform, useValue: platform }] });
    return TestBed.inject(IonicDevicePlatform);
  }

  it('is a native app when Platform reports hybrid', () => {
    expect(setup(['hybrid']).isNativeApp()).toBeTrue();
  });

  it('is iOS but not a native app in an iOS browser', () => {
    const device = setup(['ios']);

    expect(device.isIos()).toBeTrue();
    expect(device.isNativeApp()).toBeFalse();
  });

  it('is Android when Platform reports android', () => {
    const device = setup(['android']);

    expect(device.isAndroid()).toBeTrue();
    expect(device.isIos()).toBeFalse();
  });
});
