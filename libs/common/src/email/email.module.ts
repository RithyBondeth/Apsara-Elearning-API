import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailService } from './email.service';
import { RESEND_CLIENT } from './email.constant';

@Global()
@Module({
  providers: [
    {
      provide: RESEND_CLIENT,
      useFactory: (configService: ConfigService) => {
        return new Resend(configService.get<string>('RESEND_API_KEY'));
      },
      inject: [ConfigService],
    },

    EmailService,
  ],

  exports: [EmailService],
})
export class EmailModule {}
