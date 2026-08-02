import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '../jwt/jwt.service';
import { IJWTPayload } from '../jwt/interfaces/jwt-payload.interface';

/**
 * Authenticates the request (valid JWT) AND authorizes it (payload.isAdmin).
 * Use on admin-only mutation routes. Returns 401 for a missing/invalid token
 * and 403 for a valid token that lacks admin rights.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    let payload: IJWTPayload;
    try {
      payload = await this.jwtService.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.role !== 'admin' && !payload.isAdmin) {
      throw new ForbiddenException('Administrator access required');
    }

    (request as Request & { user?: IJWTPayload }).user = payload;
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
