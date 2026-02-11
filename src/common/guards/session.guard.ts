import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { createAnonymousUser, UserWithFeatures } from '../types/user.type';

interface RequestWithUser extends Request {
  user: UserWithFeatures;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    // TODO: Inject SessionsService when available
    // private sessionsService: SessionsService,
    // TODO: Inject UsersService when available
    // private usersService: UsersService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (request.cookies?.session_id) {
      this.injectAuthenticatedUser(request);
    } else {
      this.injectAnonymousUser(request);
    }

    return true;
  }

  private injectAuthenticatedUser(request: RequestWithUser): void {
    try {
      // const sessionToken = request.cookies.session_id;

      // TODO: Uncomment when SessionsService is available and make this method async
      // const session = await this.sessionsService.findOneValidByToken(sessionToken);
      // const user = await this.usersService.findOneById(session.user_id);
      // request.user = user;

      // Temporary: inject anonymous user until services are ready
      this.injectAnonymousUser(request);
    } catch {
      this.injectAnonymousUser(request);
    }
  }

  private injectAnonymousUser(request: RequestWithUser): void {
    request.user = createAnonymousUser();
  }
}
