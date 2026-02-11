import { Controller, Patch, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ActivationsService } from './activations.service';
import { RequireFeature } from '../common/decorators';

@Controller('activations')
export class ActivationsController {
  constructor(private readonly activationsService: ActivationsService) {}

  @Patch(':tokenId')
  @HttpCode(HttpStatus.OK)
  @RequireFeature('read:activation_token')
  async activate(@Param('tokenId') tokenId: string) {
    const user = await this.activationsService.activateAccount(tokenId);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword: _, ...userWithoutPassword } = user!;

    return {
      message: 'Account activated successfully',
      user: userWithoutPassword,
    };
  }
}
