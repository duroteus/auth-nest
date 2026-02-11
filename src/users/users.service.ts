import {
  ConflictException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import type { IUsersRepository } from './repositories/users.repository.interface';
import { PasswordsService } from '../passwords/passwords.service';
import { ActivationsService } from '../activations/activations.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
    private readonly passwordsService: PasswordsService,
    @Inject(forwardRef(() => ActivationsService))
    private readonly activationsService: ActivationsService,
    private readonly emailService: EmailService,
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
}
