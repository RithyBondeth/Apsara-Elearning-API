import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * The Resend client, or null when no API key is configured. Config validation
 * requires the key in production; in development and tests an empty key means
 * EmailService logs each message instead of sending it (`new Resend('')`
 * throws, which used to stop every service from booting on a fresh clone).
 */
export const emailConfig = (configService: ConfigService): Resend | null => {
  const apiKey = configService.get<string>('RESEND_API_KEY')?.trim();
  return apiKey ? new Resend(apiKey) : null;
};
