/**
 * Authentication token value object
 * Represents JWT tokens with expiration
 */
export class AuthToken {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken?: string,
    public readonly expiresIn?: number,
    public readonly tokenType: string = 'Bearer'
  ) {}

  /**
   * Check if the token is expired
   * @param tokenCreatedAt - Timestamp when the token was created
   */
  isExpired(tokenCreatedAt: number): boolean {
    if (!this.expiresIn) {
      return false;
    }
    const now = Date.now();
    const expirationTime = tokenCreatedAt + (this.expiresIn * 1000);
    return now >= expirationTime;
  }

  /**
   * Get authorization header value
   */
  getAuthorizationHeader(): string {
    return `${this.tokenType} ${this.accessToken}`;
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   * @param tokenCreatedAt - Timestamp when the token was created
   */
  willExpireSoon(tokenCreatedAt: number, bufferSeconds: number = 300): boolean {
    if (!this.expiresIn) {
      return false;
    }
    const now = Date.now();
    const expirationTime = tokenCreatedAt + (this.expiresIn * 1000);
    const bufferTime = bufferSeconds * 1000;
    return (expirationTime - now) <= bufferTime;
  }
}
