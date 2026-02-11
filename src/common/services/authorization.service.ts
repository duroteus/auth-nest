import { Injectable } from '@nestjs/common';
import { UserWithFeatures } from '../types/user.type';

@Injectable()
export class AuthorizationService {
  /**
   * Verify if a user has permission to execute an action.
   *
   * @param user - User to be verified
   * @param feature - Feature/permission required
   * @param resource - Resource being accessed (optional, used for special checks)
   * @returns true if authorized, false otherwise
   */
  can(
    user: UserWithFeatures,
    feature: string,
    resource?: { id?: string },
  ): boolean {
    let authorized = false;

    if (user.features?.includes(feature)) {
      authorized = true;
    }

    if (feature === 'update:user' && resource) {
      authorized = false;

      if (resource.id === user.id || this.can(user, 'update:user:others')) {
        authorized = true;
      }
    }

    return authorized;
  }
}
