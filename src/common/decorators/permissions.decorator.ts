import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Requires the request's access token to include ALL of the given Auth0 RBAC
 * permissions (the `permissions` claim, populated when "Add Permissions in
 * Access Token" is enabled on the API in Auth0).
 *
 *   @Permissions('write:profile')
 *   updateProfile() { ... }
 *
 *   @Permissions('read:profile', 'admin:users')
 *   adminUserView() { ... }
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
