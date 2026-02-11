import { Module } from '@nestjs/common';
import { ActivationsController } from './activations.controller';
import { ActivationsService } from './activations.service';
import { DrizzleActivationsRepository } from './repositories/drizzle-activations.repository';
import { DrizzleModule } from '../infra/database/drizzle/drizzle.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DrizzleModule, UsersModule],
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
