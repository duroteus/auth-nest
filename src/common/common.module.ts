import { Module, Global } from '@nestjs/common';
import { AuthorizationService } from './services/authorization.service';

@Global()
@Module({
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class CommonModule {}
