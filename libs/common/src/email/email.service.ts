import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateEmailResponse, Resend } from 'resend';
import { RESEND_CLIENT } from '@app/contracts';

export interface ISendEmailOptions {
  text?: string;
  replyTo?: string | string[];
  idempotencyKey?: string;
  tags?: { name: string; value: string }[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(RESEND_CLIENT)
    private readonly resend: Resend | null,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    options: ISendEmailOptions = {},
  ): Promise<CreateEmailResponse> {
    // No API key (allowed outside production): log instead of sending, so a
    // developer can still read verification codes and reset tokens.
    if (!this.resend) {
      const body = (options.text ?? html)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      this.logger.warn(
        `RESEND_API_KEY not set — email not sent.\n  To: ${to}\n  Subject: ${subject}\n  ${body}`,
      );
      return {
        data: { id: `dev-log-${randomUUID()}` },
        error: null,
        headers: null,
      };
    }

    return this.resend.emails.send(
      {
        from: this.configService.get<string>('EMAIL_FROM')!,
        to,
        subject,
        html,
        ...(options.text ? { text: options.text } : {}),
        ...(options.replyTo ? { replyTo: options.replyTo } : {}),
        ...(options.tags ? { tags: options.tags } : {}),
      },
      options.idempotencyKey
        ? { idempotencyKey: options.idempotencyKey }
        : undefined,
    );
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
      <p>Your Token is:</p>
      <h1>${otp}</h1>
      <p>This Token will expire in 10 minutes.</p>
      <p>Please verify your email to continue.</p>
      `,
    );
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
  ): Promise<CreateEmailResponse> {
    return this.sendEmail(
      email,
      'Reset your password',
      `
      <h2>Reset Password</h2>
      <p>Use the token below to reset your password:</p>
      <h1>${token}</h1>
      <p>This token will expire shortly. If you did not request a password reset, you can safely ignore this email.</p>
      `,
    );
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
  ): Promise<CreateEmailResponse> {
    return this.sendEmail(
      email,
      'Welcome to Apsara Elearning',
      `
      <h1>Welcome ${name}</h1>
      <p>Thank you for joining Apsara Elearning.</p>
      `,
    );
  }
}
