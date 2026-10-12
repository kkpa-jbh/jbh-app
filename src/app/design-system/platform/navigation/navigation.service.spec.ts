import { TestBed } from '@angular/core/testing';
import { MenuController } from '@ionic/angular/standalone';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
  it('closes the side menu once', async () => {
    const menuController = jasmine.createSpyObj<MenuController>('MenuController', ['close']);
    menuController.close.and.resolveTo(true);
    TestBed.configureTestingModule({ providers: [{ provide: MenuController, useValue: menuController }] });

    await TestBed.inject(NavigationService).closeMenu();

    expect(menuController.close).toHaveBeenCalledTimes(1);
  });
});
