import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor(options?: { message?: string; action?: string; cause?: Error }) {
    const message = options?.message || 'Resource not found';
    const action =
      options?.action ||
      'Verify if the resource you are trying to access exists.';

    super(
      {
        name: 'NotFoundError',
        message,
        action,
        status_code: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
      {
        cause: options?.cause,
      },
    );

    this.name = 'NotFoundError';
  }
}
