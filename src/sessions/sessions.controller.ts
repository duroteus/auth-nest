import {
  Controller,
  Post,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { RequireFeature } from '../common/decorators';

@Controller('sessions')
export class SessionsController {
  private readonly COOKIE_NAME = 'session_id';
  private readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireFeature('create:session')
  async create(
    @Body() createSessionDto: CreateSessionDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.sessionsService.create(createSessionDto);

    response.cookie(this.COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.COOKIE_MAX_AGE,
      path: '/',
    });

    return {
      message: 'Session created successfully',
      expiresAt: session.expiresAt,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async destroy(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies?.[this.COOKIE_NAME] as string | undefined;

    if (token) {
      await this.sessionsService.destroy(token);
    }

    response.clearCookie(this.COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return;
  }
}
