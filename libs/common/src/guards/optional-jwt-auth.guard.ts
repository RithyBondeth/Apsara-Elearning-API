import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '../jwt/jwt.service';
import { IJWTPayload } from '../jwt/interfaces/jwt-payload.interface';

/** Attaches a valid user when present while keeping genuinely public requests public. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (!header) return true;

    const [scheme, token, extra] = header.split(' ');
    if (scheme !== 'Bearer' || !token || extra) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    try {
      const user = await this.jwtService.verifyToken(token);
      (request as Request & { user?: IJWTPayload }).user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
