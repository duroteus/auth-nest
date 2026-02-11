import { Module, Global } from '@nestjs/common';
import { AuthorizationService } from './services/authorization.service';
import { SessionGuard } from './guards/session.guard';
import { SessionsModule } from '../sessions/sessions.module';

@Global()
@Module({
  imports: [SessionsModule],
  providers: [AuthorizationService, SessionGuard],
  exports: [AuthorizationService, SessionGuard],
})
export class CommonModule {}
