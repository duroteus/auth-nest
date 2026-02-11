import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './infra/database/drizzle/drizzle.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { ActivationsModule } from './activations/activations.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    DrizzleModule,
    CommonModule,
    UsersModule,
    SessionsModule,
    ActivationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
