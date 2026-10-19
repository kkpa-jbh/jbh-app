import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface HeaderAction {
  id: string;
  icon: string;
  label?: string;
  handler: () => void;
}

export interface PageHeaderConfig {
  title: string;
  showBackButton?: boolean;
  /** Where the back button goes when there is no history to go back to. */
  defaultBackHref?: string;
  actions?: HeaderAction[];
}

@Injectable({ providedIn: 'root' })
export class HeaderActionsService {
  private configSubject = new BehaviorSubject<PageHeaderConfig | null>(null);
  public config$: Observable<PageHeaderConfig | null> = this.configSubject.asObservable();

  setPageConfig(config: PageHeaderConfig): void {
    this.configSubject.next(config);
  }

  clearPageConfig(): void {
    this.configSubject.next(null);
  }

  getCurrentConfig(): PageHeaderConfig | null {
    return this.configSubject.value;
  }
}
