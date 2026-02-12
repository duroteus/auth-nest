import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './infra/database/drizzle/drizzle.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { ActivationsModule } from './activations/activations.module';
import { CommonModule, SessionGuard, FeatureGuard } from './common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    DrizzleModule,
    CommonModule,
    UsersModule,
    SessionsModule,
    ActivationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FeatureGuard,
    },
  ],
})
export class AppModule {}
