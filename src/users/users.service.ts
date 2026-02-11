import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { IUsersRepository } from './repositories/users.repository.interface';
import { PasswordsService } from '../passwords/passwords.service';
import { ActivationsService } from '../activations/activations.service';
import { EmailService } from '../email/email.service';
import { AuthorizationService } from '../common/services/authorization.service';
import { UserWithFeatures } from '../common/types/user.type';

@Injectable()
export class UsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
    private readonly passwordsService: PasswordsService,
    @Inject(forwardRef(() => ActivationsService))
    private readonly activationsService: ActivationsService,
    private readonly emailService: EmailService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUserByEmail = await this.usersRepository.findByEmail(
      createUserDto.email,
    );

    if (existingUserByEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUserByUsername = await this.usersRepository.findByUsername(
      createUserDto.username,
    );

    if (existingUserByUsername) {
      throw new ConflictException('Username already in use');
    }

    const hashedPassword = await this.passwordsService.hash(
      createUserDto.password,
    );

    const newUser = await this.usersRepository.create({
      username: createUserDto.username,
      email: createUserDto.email,
      hashedPassword,
    });

    // Create activation token and send email
    const activationToken = await this.activationsService.createActivationToken(
      newUser.id,
    );

    await this.emailService.sendActivationEmail(
      newUser.email,
      newUser.username,
      activationToken.id,
    );

    return newUser;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async findByUsername(username: string) {
    const user = await this.usersRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundException({
        message: 'The informed username was not found in the system.',
        action: 'Verify if the username is spelled correctly.',
      });
    }
    return user;
  }

  async update(
    username: string,
    updateUserDto: UpdateUserDto,
    currentUser: UserWithFeatures,
  ) {
    const targetUser = await this.usersRepository.findByUsername(username);
    if (!targetUser) {
      throw new NotFoundException({
        message: 'The informed username was not found in the system.',
        action: 'Verify if the username is spelled correctly.',
      });
    }

    if (
      !this.authorizationService.can(currentUser, 'update:user', targetUser)
    ) {
      throw new ForbiddenException({
        message: 'You do not have permission to update another user.',
        action:
          'Verify if you have the necessary feature to update another user.',
      });
    }

    if (updateUserDto.username !== undefined) {
      const normalizedNew = updateUserDto.username.toLowerCase();
      const normalizedCurrent = username.toLowerCase();
      if (normalizedNew !== normalizedCurrent) {
        const existing = await this.usersRepository.findByUsername(
          updateUserDto.username,
        );
        if (existing) {
          throw new ConflictException('Username already in use');
        }
      }
    }

    if (updateUserDto.email !== undefined) {
      const existing = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );
      if (existing && existing.id !== targetUser.id) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateData: {
      username?: string;
      email?: string;
      hashedPassword?: string;
    } = {};

    if (updateUserDto.username !== undefined) {
      updateData.username = updateUserDto.username;
    }
    if (updateUserDto.email !== undefined) {
      updateData.email = updateUserDto.email;
    }
    if (updateUserDto.password !== undefined) {
      updateData.hashedPassword = await this.passwordsService.hash(
        updateUserDto.password,
      );
    }

    return this.usersRepository.update(targetUser.id, updateData);
  }
}
