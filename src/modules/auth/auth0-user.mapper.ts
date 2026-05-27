import { Auth0JwtPayload, AuthenticatedUser } from './auth0.types';

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
};

/**
 * Maps a verified Auth0 access-token payload into our normalized
 * `AuthenticatedUser`. Custom claims live under a configurable namespace prefix
 * (set via an Auth0 Action). All optional claims fail gracefully.
 */
export const mapAuth0Payload = (
  payload: Auth0JwtPayload,
  namespace: string,
): AuthenticatedUser => {
  const ns = namespace.endsWith('/') ? namespace : `${namespace}/`;

  const scope = typeof payload.scope === 'string' ? payload.scope : '';
  const scopes = scope.split(' ').filter(Boolean);

  return {
    sub: payload.sub,
    scopes,
    permissions: asStringArray(payload.permissions),
    roles: asStringArray(payload[`${ns}roles`]),
    email: asString(payload[`${ns}email`]),
    name: asString(payload[`${ns}name`]),
    picture: asString(payload[`${ns}picture`]),
    clientId: asString(payload.azp),
    raw: payload,
  };
};
