import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { RESEND_CLIENT } from '@app/contracts';
import { emailConfig } from './config/email.config';

@Global()
@Module({
  providers: [
    {
      provide: RESEND_CLIENT,
      useFactory: emailConfig,
      inject: [ConfigService],
    },
    EmailService,
  ],

  exports: [EmailService],
})
export class EmailModule {}
