import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DrizzleModule } from '../infra/database/drizzle/drizzle.module';
import { DrizzleUsersRepository } from './repositories/drizzle-users.repository';
import { PasswordsModule } from '../passwords/passwords.module';
import { EmailModule } from '../email/email.module';
import { ActivationsModule } from '../activations/activations.module';

@Module({
  imports: [
    DrizzleModule,
    PasswordsModule,
    EmailModule,
    forwardRef(() => ActivationsModule),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'IUsersRepository',
      useClass: DrizzleUsersRepository,
    },
  ],
  exports: [
    UsersService,
    {
      provide: 'IUsersRepository',
      useClass: DrizzleUsersRepository,
    },
  ],
})
export class UsersModule {}
