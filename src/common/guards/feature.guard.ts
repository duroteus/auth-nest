import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '../decorators/require-feature.decorator';
import { ForbiddenException } from '../exceptions';
import { UserWithFeatures } from '../types/user.type';

interface RequestWithUser {
  user: UserWithFeatures;
}

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user: UserWithFeatures = request.user;

    if (!user) {
      throw new ForbiddenException({
        message: 'You do not have permission to execute this action.',
        action: 'Login to continue.',
      });
    }

    const hasFeature = user.features?.includes(requiredFeature);

    if (!hasFeature) {
      throw new ForbiddenException({
        message: 'You do not have permission to execute this action.',
        action: `Verify if your user has the feature "${requiredFeature}".`,
      });
    }

    return true;
  }
}
