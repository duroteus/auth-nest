import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import type { IUsersRepository } from './repositories/users.repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
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

    const hashedPassword = createUserDto.password; // TODO: Implement password hashing

    const newUser = await this.usersRepository.create({
      username: createUserDto.username,
      email: createUserDto.email,
      hashedPassword,
    });

    return newUser;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }
}
