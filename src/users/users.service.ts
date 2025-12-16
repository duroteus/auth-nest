import { ConflictException, Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/infra/database/drizzle/drizzle.service';
import { users } from 'src/infra/database/drizzle/schema';
import { eq } from 'drizzle-orm';

import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(createUserDto: CreateUserDto) {
    const db = this.drizzleService.connection;

    const existingUserByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, createUserDto.email))
      .limit(1);

    if (existingUserByEmail.length > 0) {
      throw new ConflictException('Email already in use');
    }

    const existingUserByUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, createUserDto.username))
      .limit(1);

    if (existingUserByUsername.length > 0) {
      throw new ConflictException('Username already in use');
    }

    const hashedPassword = createUserDto.password; // TODO: Implement password hashing;

    const [newUser] = await db
      .insert(users)
      .values({
        username: createUserDto.username,
        email: createUserDto.email,
        hashedPassword,
      })
      .returning();

    const { hashedPassword: _, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }

  async findByEmail(email: string) {
    const db = this.drizzleService.connection;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  }

  async findById(id: string) {
    const db = this.drizzleService.connection;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  }
}
