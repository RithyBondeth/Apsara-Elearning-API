import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { IJWTPayload } from '../jwt/interfaces/jwt-payload.interface';

/**
 * Reads the JWT payload attached by JwtAuthGuard.
 * Usage: `@CurrentUser() user: IJWTPayload` or `@CurrentUser('id') userId: string`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof IJWTPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: IJWTPayload }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
