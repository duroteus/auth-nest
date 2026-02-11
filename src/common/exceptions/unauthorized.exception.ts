import { HttpException, HttpStatus } from '@nestjs/common';

export class UnauthorizedException extends HttpException {
  constructor(options?: { message?: string; action?: string; cause?: Error }) {
    const message = options?.message || 'User not authenticated';
    const action =
      options?.action || 'Verify if you are authenticated and try again.';

    super(
      {
        name: 'UnauthorizedError',
        message,
        action,
        status_code: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
      {
        cause: options?.cause,
      },
    );

    this.name = 'UnauthorizedError';
  }
}
