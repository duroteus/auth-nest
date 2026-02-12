import { Inject, Injectable } from '@nestjs/common';
import type { IActivationsRepository } from './repositories/activations.repository.interface';
import type { IUsersRepository } from '../users/repositories/users.repository.interface';
import { NotFoundException, ForbiddenException } from '../common/exceptions';

@Injectable()
export class ActivationsService {
  private readonly TOKEN_EXPIRATION_MINUTES = 15;
  private readonly ACTIVATED_USER_FEATURES = [
    'create:session',
    'read:session',
    'update:user',
  ];

  constructor(
    @Inject('IActivationsRepository')
    private readonly activationsRepository: IActivationsRepository,
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  async createActivationToken(userId: string) {
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + this.TOKEN_EXPIRATION_MINUTES,
    );

    const token = await this.activationsRepository.create({
      userId,
      expiresAt,
    });

    return token;
  }

  async activateByUserId(userId: string) {
    const token = await this.activationsRepository.findValidByUserId(userId);
    if (!token) {
      throw new NotFoundException({
        message: 'Activation token not found or expired.',
        action: 'Create a new account.',
      });
    }
    return this.activateAccount(token.id);
  }

  async activateAccount(tokenId: string) {
    const token = await this.activationsRepository.findById(tokenId);

    if (!token) {
      throw new NotFoundException({ message: 'Activation token not found' });
    }

    if (token.usedAt) {
      throw new ForbiddenException({
        message: 'Activation token already used',
      });
    }

    if (token.expiresAt < new Date()) {
      throw new ForbiddenException({
        message: 'Activation token expired',
      });
    }

    const user = await this.usersRepository.findById(token.userId);

    if (!user) {
      throw new NotFoundException({ message: 'User not found' });
    }

    await this.usersRepository.updateFeatures(
      user.id,
      this.ACTIVATED_USER_FEATURES,
    );

    await this.activationsRepository.markAsUsed(tokenId);

    const updatedUser = await this.usersRepository.findById(user.id);
    return updatedUser;
  }

  async cleanupExpiredTokens() {
    await this.activationsRepository.deleteExpired();
  }
}
