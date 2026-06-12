import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateEmailResponse, Resend } from 'resend';
import { RESEND_CLIENT } from '@app/contracts';
@Injectable()
export class EmailService {
  constructor(
    @Inject(RESEND_CLIENT)
    private readonly resend: Resend,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<CreateEmailResponse> {
    return this.resend.emails.send({
      from: this.configService.get<string>('EMAIL_FROM')!,
      to,
      subject,
      html,
    });
  }

  async sendVerificationEmail(
    email: string,
    otp: string,
  ): Promise<CreateEmailResponse> {
    return this.sendEmail(
      email,
      'Verify your email',
      `
      <h2>Verify Email</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP expires in 10 minutes.</p>
      `,
    );
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
  ): Promise<CreateEmailResponse> {
    return this.sendEmail(
      email,
      'Welcome to KodeKH',
      `
      <h1>Welcome ${name}</h1>
      <p>Thank you for joining KodeKH.</p>
      `,
    );
  }
}
