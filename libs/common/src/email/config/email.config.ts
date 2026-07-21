import { ConfigService } from '@nestjs/config';

export const emailConfig = async (
  configService: ConfigService,
): Promise<{ apiKey: string }> => ({
  apiKey: configService.get<string>('RESEND_API_KEY')!,
});
