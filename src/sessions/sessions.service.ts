import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { ISessionsRepository } from './repositories/sessions.repository.interface';
import type { IUsersRepository } from '../users/repositories/users.repository.interface';
import { PasswordsService } from '../passwords/passwords.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UnauthorizedException } from '../common/exceptions';

@Injectable()
export class SessionsService {
  private readonly SESSION_EXPIRATION_DAYS = 30;

  constructor(
    @Inject('ISessionsRepository')
    private readonly sessionsRepository: ISessionsRepository,
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
    private readonly passwordsService: PasswordsService,
  ) {}

  async createForUser(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        message: 'User not found.',
        action: 'Verify the user ID.',
      });
    }

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SESSION_EXPIRATION_DAYS);

    const session = await this.sessionsRepository.create({
      token,
      userId,
      expiresAt,
    });

    return {
      token: session.token,
      expiresAt: session.expiresAt,
      userId: session.userId,
    };
  }

  async create(createSessionDto: CreateSessionDto) {
    const normalizedEmail = createSessionDto.email.toLowerCase();
    const user = await this.usersRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
        action: 'Verify that the submitted data is correct.',
      });
    }

    const isPasswordValid = await this.passwordsService.compare(
      createSessionDto.password,
      user.hashedPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
        action: 'Verify that the submitted data is correct.',
      });
    }

    const token = this.generateToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SESSION_EXPIRATION_DAYS);

    const session = await this.sessionsRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });

    return {
      token: session.token,
      expiresAt: session.expiresAt,
    };
  }

  async validateToken(token: string) {
    const session = await this.sessionsRepository.findByToken(token);

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      await this.sessionsRepository.deleteByToken(token);
      return null;
    }

    return session;
  }

  async renewSession(token: string) {
    const session = await this.validateToken(token);

    if (!session) {
      throw new UnauthorizedException({
        message: 'Invalid or expired session',
      });
    }

    await this.sessionsRepository.deleteByToken(token);

    const newToken = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SESSION_EXPIRATION_DAYS);

    const newSession = await this.sessionsRepository.create({
      token: newToken,
      userId: session.userId,
      expiresAt,
    });

    return {
      token: newSession.token,
      expiresAt: newSession.expiresAt,
    };
  }

  async destroy(token: string) {
    await this.sessionsRepository.deleteByToken(token);
  }

  async getUserByToken(token: string) {
    const session = await this.validateToken(token);

    if (!session) {
      return null;
    }

    const user = await this.usersRepository.findById(session.userId);
    return user;
  }

  private generateToken(): string {
    return randomBytes(48).toString('hex');
  }

  async cleanupExpiredSessions() {
    await this.sessionsRepository.deleteExpired();
  }
}
