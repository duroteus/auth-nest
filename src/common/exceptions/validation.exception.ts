import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(options?: { message?: string; action?: string; cause?: Error }) {
    const message = options?.message || 'Invalid data';
    const action =
      options?.action ||
      'Review the data sent and try again. If the problem persists, contact support.';

    super(
      {
        name: 'ValidationError',
        message,
        action,
        status_code: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
      {
        cause: options?.cause,
      },
    );

    this.name = 'ValidationError';
  }
}
