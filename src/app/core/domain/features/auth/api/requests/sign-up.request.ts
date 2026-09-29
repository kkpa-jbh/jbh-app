/**
 * Body of POST /auth/signup (jbh-iam SignUpRequest).
 * The password needs at least 8 characters (UserRegistrationService.MIN_PASSWORD_LENGTH).
 */
export interface SignUpRequest {
  name: string;
  username: string;
  email: string;
  password: string;
}
