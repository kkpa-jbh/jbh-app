import { Injectable, NgZone } from '@angular/core';
import { EnvironmentConfig } from '../config/environment.config';

// Minimal shape of the Google Identity Services API we use.
// Kept local to avoid adding @types/google.accounts for three calls.
interface GoogleAccountsId {
  initialize(config: { client_id: string; callback: (response: { credential: string }) => void }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
}

export type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with';

/**
 * Loads Google Identity Services and renders the "Sign in with Google" button.
 * The button hands back a Google ID token; the backend verifies it and starts the session.
 */
@Injectable({
  providedIn: 'root'
})
export class GoogleSignInService {

  private static readonly SCRIPT_URL = 'https://accounts.google.com/gsi/client';

  private loading: Promise<GoogleAccountsId> | null = null;
  // initialize() may run only once per page load, so the callback forwards to the active page's handler.
  private onCredential: ((idToken: string) => void) | null = null;

  constructor(private envConfig: EnvironmentConfig, private zone: NgZone) {}

  get isEnabled(): boolean {
    return !!this.envConfig.googleClientId;
  }

  /**
   * Render Google's button inside the given element.
   * @param parent - Element that will hold the button
   * @param text - Button label variant
   * @param onCredential - Called with the ID token after the user picks an account
   */
  async renderButton(parent: HTMLElement, text: GoogleButtonText, onCredential: (idToken: string) => void): Promise<void> {
    const accountsId = await this.load();
    this.onCredential = onCredential;
    accountsId.renderButton(parent, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text,
      width: Math.min(parent.clientWidth || 400, 400)
    });
  }

  private load(): Promise<GoogleAccountsId> {
    if (!this.loading) {
      this.loading = new Promise<GoogleAccountsId>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = GoogleSignInService.SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          // Optional property: the cast must overlap with Window, which has no `google`.
          const accountsId = (window as Window & { google?: { accounts: { id: GoogleAccountsId } } }).google?.accounts.id;
          if (!accountsId) {
            this.loading = null;
            reject(new Error('Google Identity Services loaded without accounts.id'));
            return;
          }
          accountsId.initialize({
            client_id: this.envConfig.googleClientId,
            // Google calls this outside Angular's zone; re-enter it so the page updates.
            callback: response => this.zone.run(() => this.onCredential?.(response.credential))
          });
          resolve(accountsId);
        };
        script.onerror = () => {
          this.loading = null;
          reject(new Error('Could not load Google Identity Services'));
        };
        document.head.appendChild(script);
      });
    }
    return this.loading;
  }
}
