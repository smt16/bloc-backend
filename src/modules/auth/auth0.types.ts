/**
 * Shape of an Auth0-issued access token payload.
 *
 * Only well-known fields are typed; the rest is reachable via index access for
 * custom (namespaced) claims set via Auth0 Actions.
 */
export interface Auth0JwtPayload {
  iss: string;
  sub: string;
  aud: string | string[];
  iat: number;
  exp: number;
  azp?: string;
  /** Space-separated OAuth2 scopes — present when offline_access etc. is requested. */
  scope?: string;
  /** RBAC permissions — present when "Add Permissions in Access Token" is on. */
  permissions?: string[];
  [claim: string]: unknown;
}

/**
 * Normalized representation of the authenticated principal, derived from the
 * verified JWT and surfaced via the `@CurrentUser()` decorator.
 */
export interface AuthenticatedUser {
  /** Auth0 user id, e.g. "auth0|abc123" or "google-oauth2|123…". */
  sub: string;
  /** OAuth2 scopes granted to this token. */
  scopes: string[];
  /** RBAC permissions from the `permissions` claim. */
  permissions: string[];
  /** Roles, read from `${namespace}roles` (set via an Auth0 Action). */
  roles: string[];
  /** Custom-claim email, if provided via Action: `${namespace}email`. */
  email?: string;
  /** Custom-claim name, if provided via Action: `${namespace}name`. */
  name?: string;
  /** Custom-claim avatar, if provided via Action: `${namespace}picture`. */
  picture?: string;
  /** Auth0 application client id that minted the token (`azp` claim). */
  clientId?: string;
  /** Verified bearer token — used internally to call /userinfo when needed. */
  accessToken?: string;
  /** Full, verified JWT payload — escape hatch for app-specific claims. */
  raw: Auth0JwtPayload;
}
