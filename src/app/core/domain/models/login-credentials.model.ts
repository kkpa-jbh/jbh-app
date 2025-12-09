/**
 * Login credentials value object
 */
export class LoginCredentials {
  constructor(
    public readonly username: string,
    public readonly password: string
  ) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
  }
}
