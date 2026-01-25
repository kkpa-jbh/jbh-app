import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { AuthToken } from '../models/auth-token.model';
import { LoginCredentials } from '../models/login-credentials.model';

/**
 * Authentication repository interface (Port)
 * Defines the contract for authentication operations
 */
export abstract class AuthRepository {

  /**
   * Authenticate user with credentials
   * @param credentials - Login credentials
   * @returns Observable of authentication token
   */
  abstract login(credentials: LoginCredentials): Observable<AuthToken>;

  /**
   * Refresh the authentication token
   * @param refreshToken - Optional refresh token (for mobile apps).
   *                       If not provided, expects refresh token from HTTP-only cookies (web/PWA)
   * @returns Observable of new authentication token
   */
  abstract refreshToken(refreshToken?: string): Observable<AuthToken>;

  /**
   * Logout the current user
   * @returns Observable of void
   */
  abstract logout(): Observable<void>;

  /**
   * Get current user profile
   * @returns Observable of user
   */
  abstract getCurrentUser(): Observable<User>;

  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Observable of user
   */
  abstract register(userData: any): Observable<User>;

  /**
   * Verify user's email or token
   * @param token - Verification token
   * @returns Observable of void
   */
  abstract verifyEmail(token: string): Observable<void>;

  /**
   * Request password reset
   * @param email - User email
   * @returns Observable of void
   */
  abstract requestPasswordReset(email: string): Observable<void>;

  /**
   * Reset password with token
   * @param token - Reset token
   * @param newPassword - New password
   * @returns Observable of void
   */
  abstract resetPassword(token: string, newPassword: string): Observable<void>;

  /**
   * Check if username/nickname is available
   * @param username - Username to check
   * @returns Observable of availability status
   */
  abstract checkUsernameAvailability(username: string): Observable<{ available: boolean }>;

  /**
   * Check if email is available
   * @param email - Email to check
   * @returns Observable of availability status
   */
  abstract checkEmailAvailability(email: string): Observable<{ available: boolean }>;
}
