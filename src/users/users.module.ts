import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DrizzleModule } from '../infra/database/drizzle/drizzle.module';
import { DrizzleUsersRepository } from './repositories/drizzle-users.repository';

@Module({
  imports: [DrizzleModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'IUsersRepository',
      useClass: DrizzleUsersRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
