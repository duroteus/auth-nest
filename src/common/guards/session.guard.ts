import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { createAnonymousUser, UserWithFeatures } from '../types/user.type';
import { SessionsService } from '../../sessions/sessions.service';

interface RequestWithUser extends Request {
  user: UserWithFeatures;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private sessionsService: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (request.cookies?.session_id) {
      await this.injectAuthenticatedUser(request);
    } else {
      this.injectAnonymousUser(request);
    }

    return true;
  }

  private async injectAuthenticatedUser(
    request: RequestWithUser,
  ): Promise<void> {
    try {
      const sessionToken = request.cookies.session_id as string;
      const user = await this.sessionsService.getUserByToken(sessionToken);

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hashedPassword, ...userWithoutPassword } = user;
        request.user = {
          ...userWithoutPassword,
          features: user.features ?? [],
        } as UserWithFeatures;
      } else {
        this.injectAnonymousUser(request);
      }
    } catch {
      this.injectAnonymousUser(request);
    }
  }

  private injectAnonymousUser(request: RequestWithUser): void {
    request.user = createAnonymousUser();
  }
}
