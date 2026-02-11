import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ValidationException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerException,
} from '../exceptions';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (
      exception instanceof ValidationException ||
      exception instanceof NotFoundException ||
      exception instanceof UnauthorizedException ||
      exception instanceof ForbiddenException
    ) {
      if (exception instanceof UnauthorizedException) {
        this.clearSessionCookie(response);
      }

      const exceptionResponse = exception.getResponse();
      const status = exception.getStatus();

      return response.status(status).json(exceptionResponse);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (status === 401) {
        this.clearSessionCookie(response);
      }

      return response.status(status).json(exceptionResponse);
    }

    const publicErrorObject = new InternalServerException({
      cause: exception,
    });

    console.log('\n❌ Unhandled error captured by exception filter:\n');
    console.error(exception);

    const status = publicErrorObject.getStatus();
    const errorResponse = publicErrorObject.getResponse();

    return response.status(status).json(errorResponse);
  }

  private clearSessionCookie(response: Response): void {
    response.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
