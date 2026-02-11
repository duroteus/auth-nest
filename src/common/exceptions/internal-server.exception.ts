import { HttpException, HttpStatus } from '@nestjs/common';

export class InternalServerException extends HttpException {
  constructor(options?: {
    message?: string;
    action?: string;
    cause?: unknown;
  }) {
    const message =
      options?.message || 'Internal server error. Please try again.';
    const action =
      options?.action ||
      'An unexpected error occurred. Please contact support.';

    super(
      {
        name: 'InternalServerError',
        message,
        action,
        status_code: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        cause: options?.cause,
      },
    );

    this.name = 'InternalServerError';
  }
}
