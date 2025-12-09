/**
 * User domain entity
 * Represents a user in the system
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly roles?: string[],
    public readonly permissions?: string[]
  ) {}

  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.username;
  }

  hasRole(role: string): boolean {
    return this.roles?.includes(role) ?? false;
  }

  hasPermission(permission: string): boolean {
    return this.permissions?.includes(permission) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  hasAllRoles(roles: string[]): boolean {
    return roles.every(role => this.hasRole(role));
  }
}
