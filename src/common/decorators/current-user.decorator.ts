import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserWithFeatures } from '../types/user.type';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserWithFeatures => {
    const request = ctx.switchToHttp().getRequest<{ user: UserWithFeatures }>();
    return request.user;
  },
);
