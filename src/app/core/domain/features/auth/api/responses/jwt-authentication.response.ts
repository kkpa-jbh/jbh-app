/**
 * Answer of /auth/signin, /auth/google and /auth/refresh (jbh-iam JwtAuthenticationResponse).
 * The snake_case fields are fallbacks the mapper also accepts.
 */
export interface JwtAuthenticationResponse {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  expiresIn?: number;
  expires_in?: number;
  tokenType?: string;
  token_type?: string;
}
