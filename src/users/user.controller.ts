import { Controller, Get } from '@nestjs/common';
import { RequireFeature, CurrentUser } from '../common/decorators';
import type { UserWithFeatures } from '../common/types/user.type';

@Controller('user')
export class UserController {
  @Get()
  @RequireFeature('read:session')
  getCurrentUser(@CurrentUser() user: UserWithFeatures) {
    return user;
  }
}
