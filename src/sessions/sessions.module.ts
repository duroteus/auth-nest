import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { DrizzleSessionsRepository } from './repositories/drizzle-sessions.repository';
import { DrizzleModule } from '../infra/database/drizzle/drizzle.module';
import { UsersModule } from '../users/users.module';
import { PasswordsModule } from '../passwords/passwords.module';

@Module({
  imports: [DrizzleModule, UsersModule, PasswordsModule],
  controllers: [SessionsController],
  providers: [
    SessionsService,
    {
      provide: 'ISessionsRepository',
      useClass: DrizzleSessionsRepository,
    },
  ],
  exports: [SessionsService],
})
export class SessionsModule {}
