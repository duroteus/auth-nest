import { Module, forwardRef } from '@nestjs/common';
import { ActivationsController } from './activations.controller';
import { ActivationsService } from './activations.service';
import { DrizzleActivationsRepository } from './repositories/drizzle-activations.repository';
import { DrizzleModule } from '../infra/database/drizzle/drizzle.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DrizzleModule, forwardRef(() => UsersModule), EmailModule],
  controllers: [ActivationsController],
  providers: [
    ActivationsService,
    {
      provide: 'IActivationsRepository',
      useClass: DrizzleActivationsRepository,
    },
  ],
  exports: [ActivationsService],
})
export class ActivationsModule {}
