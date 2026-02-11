import { HttpException, HttpStatus } from '@nestjs/common';

export class ForbiddenException extends HttpException {
  constructor(options?: { message?: string; action?: string; cause?: Error }) {
    const message = options?.message || 'User not authorized';
    const action =
      options?.action || 'Verify the required features before continuing.';

    super(
      {
        name: 'ForbiddenError',
        message,
        action,
        status_code: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN,
      {
        cause: options?.cause,
      },
    );

    this.name = 'ForbiddenError';
  }
}
