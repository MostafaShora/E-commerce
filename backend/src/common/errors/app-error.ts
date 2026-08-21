import { HttpException, HttpStatus } from '@nestjs/common';

export const ErrorCodes = {
  ERR_INTERNAL: 'ERR_INTERNAL',
  ERR_BAD_REQUEST: 'ERR_BAD_REQUEST',
  ERR_UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  ERR_FORBIDDEN: 'ERR_FORBIDDEN',
  ERR_NOT_FOUND: 'ERR_NOT_FOUND',
  ERR_VALIDATION: 'ERR_VALIDATION',
} as const;

export type ErrorCodeType = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends HttpException {
  public readonly errorCode: ErrorCodeType;

  constructor(message: string, statusCode: number, errorCode: ErrorCodeType) {
    super(
      {
        message,
        errorCode,
      },
      statusCode,
    );

    this.errorCode = errorCode;
  }
}

export class InternalServerException extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.ERR_INTERNAL);
  }
}

export class NotFoundException extends AppError {
  constructor(message = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND, ErrorCodes.ERR_NOT_FOUND);
  }
}

export class BadRequestException extends AppError {
  constructor(message = 'Bad Request') {
    super(message, HttpStatus.BAD_REQUEST, ErrorCodes.ERR_BAD_REQUEST);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCodes.ERR_UNAUTHORIZED);
  }
}

export class ForbiddenException extends AppError {
  constructor(message = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN, ErrorCodes.ERR_FORBIDDEN);
  }
}
