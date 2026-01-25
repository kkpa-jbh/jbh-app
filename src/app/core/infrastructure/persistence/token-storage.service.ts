import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { AuthToken } from '../../domain/models/auth-token.model';
import { LoggerService } from '../logging/logger.service';

/**
 * Token storage service
 * Handles secure storage of authentication tokens using Capacitor Preferences
 */
@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  private readonly TOKEN_KEY = 'jbh_auth_token';
  private readonly REFRESH_TOKEN_KEY = 'jbh_refresh_token';
  private readonly TOKEN_TIMESTAMP_KEY = 'jbh_token_timestamp';

  constructor(private logger: LoggerService) {}

  /**
   * Save authentication token
   * @param token - Authentication token to save
   */
  async saveToken(token: AuthToken): Promise<void> {
    try {
      await Preferences.set({
        key: this.TOKEN_KEY,
        value: token.accessToken
      });

      if (token.refreshToken) {
        await Preferences.set({
          key: this.REFRESH_TOKEN_KEY,
          value: token.refreshToken
        });
      }

      await Preferences.set({
        key: this.TOKEN_TIMESTAMP_KEY,
        value: Date.now().toString()
      });
    } catch (error) {
      this.logger.error('Error saving token:', 'TokenStorage', error);
      throw error;
    }
  }

  /**
   * Get stored access token
   * @returns Access token or null
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const result = await Preferences.get({ key: this.TOKEN_KEY });
      return result.value;
    } catch (error) {
      this.logger.error('Error getting access token:', 'TokenStorage', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   * @returns Refresh token or null
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const result = await Preferences.get({ key: this.REFRESH_TOKEN_KEY });
      return result.value;
    } catch (error) {
      this.logger.error('Error getting refresh token:', 'TokenStorage', error);
      return null;
    }
  }

  /**
   * Get token creation timestamp
   * @returns Timestamp or null
   */
  async getTokenTimestamp(): Promise<number | null> {
    try {
      const result = await Preferences.get({ key: this.TOKEN_TIMESTAMP_KEY });
      return result.value ? parseInt(result.value, 10) : null;
    } catch (error) {
      this.logger.error('Error getting token timestamp:', 'TokenStorage', error);
      return null;
    }
  }

  /**
   * Get complete auth token with metadata
   * @returns AuthToken or null
   */
  async getAuthToken(): Promise<AuthToken | null> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return null;
      }

      const refreshToken = await this.getRefreshToken();
      return new AuthToken(accessToken, refreshToken || undefined);
    } catch (error) {
      this.logger.error('Error getting auth token:', 'TokenStorage', error);
      return null;
    }
  }

  /**
   * Clear all stored tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await Preferences.remove({ key: this.TOKEN_KEY });
      await Preferences.remove({ key: this.REFRESH_TOKEN_KEY });
      await Preferences.remove({ key: this.TOKEN_TIMESTAMP_KEY });
    } catch (error) {
      this.logger.error('Error clearing tokens:', 'TokenStorage', error);
      throw error;
    }
  }

  /**
   * Check if user has a valid token stored
   * @returns true if token exists
   */
  async hasToken(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null && token.length > 0;
  }
}
