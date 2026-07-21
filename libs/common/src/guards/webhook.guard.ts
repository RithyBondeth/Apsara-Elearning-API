import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Verifies a payment-provider webhook via a shared secret in the
 * `x-webhook-secret` header. If `WEBHOOK_SECRET` is not configured the check
 * is skipped (dev/mock) with a warning. Replace with the provider's real
 * signature verification (e.g. Stripe-Signature) for production.
 */
@Injectable()
export class WebhookGuard implements CanActivate {
  private readonly logger = new Logger(WebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('webhook.secret');
    if (!secret) {
      this.logger.warn(
        'WEBHOOK_SECRET not set — webhook signature check is disabled',
      );
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers['x-webhook-secret'];
    if (provided !== secret) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    return true;
  }
}
