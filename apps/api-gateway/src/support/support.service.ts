import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '@app/common';
import {
  ContactSupportCategory,
  ContactSupportRequestDTO,
  MessageResponseDTO,
} from '@app/contracts';

const CATEGORY_LABELS: Record<ContactSupportCategory, string> = {
  account: 'Account and sign-in',
  learning: 'Courses and learning',
  aiTutor: 'AI tutor',
  billing: 'Plans and billing',
  privacy: 'Privacy and data',
  other: 'Other',
};

const SUCCESS_MESSAGE =
  'Your message has been sent successfully. Apsara Support will review it soon.';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async sendContactMessage(
    dto: ContactSupportRequestDTO,
  ): Promise<MessageResponseDTO> {
    // Bots commonly fill every field. Return the normal success response so the
    // honeypot cannot be used to discover or tune around the filter.
    if (dto.website) {
      this.logger.warn('Support contact honeypot triggered');
      return new MessageResponseDTO({ message: SUCCESS_MESSAGE });
    }

    const supportEmail = this.configService.get<string>('support.toEmail');
    if (!supportEmail) {
      this.logger.error('SUPPORT_TO_EMAIL is not configured');
      throw new ServiceUnavailableException(
        'Support email is temporarily unavailable. Please try again later.',
      );
    }

    const category = CATEGORY_LABELS[dto.category];
    const safeSubject = dto.subject.replace(/[\r\n]+/g, ' ');
    const subject = `[Apsara Support · ${category}] ${safeSubject}`;
    const text = [
      `Name: ${dto.name}`,
      `Email: ${dto.email}`,
      `Category: ${category}`,
      `Subject: ${safeSubject}`,
      '',
      dto.message,
      '',
      `Request ID: ${dto.requestId}`,
    ].join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#1f2937">
        <div style="background:#1675d1;color:#fff;padding:24px 28px;border-radius:16px 16px 0 0">
          <p style="margin:0 0 8px;font-size:13px;opacity:.8">New Apsara Elearning support request</p>
          <h1 style="margin:0;font-size:22px">${this.escapeHtml(safeSubject)}</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:0;padding:28px;border-radius:0 0 16px 16px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#6b7280;width:110px">Name</td><td style="padding:8px 0;font-weight:600">${this.escapeHtml(dto.name)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:${this.escapeHtml(dto.email)}">${this.escapeHtml(dto.email)}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Category</td><td style="padding:8px 0">${this.escapeHtml(category)}</td></tr>
          </table>
          <div style="margin-top:20px;padding:20px;background:#f8fafc;border-radius:12px;white-space:pre-wrap;line-height:1.65">${this.escapeHtml(dto.message)}</div>
          <p style="margin:20px 0 0;color:#9ca3af;font-size:12px">Request ID: ${this.escapeHtml(dto.requestId)}</p>
        </div>
      </div>
    `;

    const result = await this.emailService.sendEmail(
      supportEmail,
      subject,
      html,
      {
        text,
        replyTo: dto.email,
        idempotencyKey: `support-contact/${dto.requestId}`,
        tags: [
          { name: 'source', value: 'contact_form' },
          { name: 'category', value: dto.category },
        ],
      },
    );

    if (result.error) {
      this.logger.error(
        `Resend rejected support request ${dto.requestId}: ${result.error.name}`,
      );
      throw new ServiceUnavailableException(
        'We could not send your message. Please try again in a moment.',
      );
    }

    this.logger.log(
      `Support request ${dto.requestId} accepted by Resend as ${result.data.id}`,
    );
    return new MessageResponseDTO({ message: SUCCESS_MESSAGE });
  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        })[character]!,
    );
  }
}
