import { HttpErrorResponse } from '@angular/common/http';

export class JBHError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly originalError: HttpErrorResponse
  ) {
    super(message);
    this.name = 'JBHError';
    Object.setPrototypeOf(this, JBHError.prototype);
  }

  get isValidationError(): boolean {
    return this.status === 422;
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isForbiddenError(): boolean {
    return this.status === 403;
  }
}
