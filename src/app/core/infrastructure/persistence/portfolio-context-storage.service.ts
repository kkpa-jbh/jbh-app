import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { PortfolioContext, PortfolioContextJSON } from '../../domain/models/portfolio-context.model';

@Injectable({ providedIn: 'root' })
export class PortfolioContextStorageService {
  private readonly CONTEXT_KEY = 'jbh_portfolio_context';

  async saveContext(context: PortfolioContext): Promise<void> {
    await Preferences.set({
      key: this.CONTEXT_KEY,
      value: JSON.stringify(context.toJSON())
    });
  }

  async getContext(): Promise<PortfolioContext | null> {
    const { value } = await Preferences.get({ key: this.CONTEXT_KEY });
    if (!value) {
      return null;
    }
    try {
      const json: PortfolioContextJSON = JSON.parse(value);
      return PortfolioContext.fromJSON(json);
    } catch (error) {
      return null;
    }
  }

  async clearContext(): Promise<void> {
    await Preferences.remove({ key: this.CONTEXT_KEY });
  }
}
