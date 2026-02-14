/**
 * Domain Types for Preferences
 *
 * Value objects and enums used across the preferences domain.
 */

/**
 * Preferences unique identifier value object.
 */
export class PreferencesId {
  constructor(public readonly value: string) {}

  toString(): string {
    return this.value;
  }

  equals(other: PreferencesId): boolean {
    return this.value === other.value;
  }
}

/**
 * Supported language codes.
 */
export enum Language {
  EN = 'EN',
  ES = 'ES'
}

/**
 * Supported currency codes.
 */
export enum Currency {
  COP = 'COP',
  USD = 'USD'
}
