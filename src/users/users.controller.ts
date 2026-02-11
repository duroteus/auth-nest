import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequireFeature, CurrentUser } from '../common/decorators';
import type { UserWithFeatures } from '../common/types/user.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireFeature('create:user')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':username')
  async findByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    const { hashedPassword: _pw, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Patch(':username')
  @RequireFeature('update:user')
  async update(
    @Param('username') username: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: UserWithFeatures,
  ) {
    return this.usersService.update(username, updateUserDto, currentUser);
  }
}
