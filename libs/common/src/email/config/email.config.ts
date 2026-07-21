import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export const emailConfig = (configService: ConfigService): Resend => {
  const apiKey = configService.get<string>('RESEND_API_KEY')!;
  return new Resend(apiKey);
};
