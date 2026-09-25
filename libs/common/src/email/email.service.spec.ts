import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Resend } from 'resend';
import { EmailService } from './email.service';
import { emailConfig } from './config/email.config';
import { validationSchema } from '../config/validation.schema';

const config = (values: Record<string, string>) =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

describe('emailConfig', () => {
  it('returns no client when the API key is blank', () => {
    expect(emailConfig(config({ RESEND_API_KEY: '' }))).toBeNull();
    expect(emailConfig(config({ RESEND_API_KEY: '   ' }))).toBeNull();
    expect(emailConfig(config({}))).toBeNull();
  });

  it('builds a client when a key is set', () => {
    expect(
      emailConfig(config({ RESEND_API_KEY: 're_test_123' })),
    ).not.toBeNull();
  });
});

describe('EmailService without an API key', () => {
  it('logs the email, including the verification code, instead of sending', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const service = new EmailService(
      null,
      config({ EMAIL_FROM: 'dev@example.com' }),
    );

    const result = await service.sendVerificationEmail(
      'learner@example.com',
      '482913',
    );

    expect(result.error).toBeNull();
    expect(result.data?.id).toMatch(/^dev-log-/);
    const logged = warn.mock.calls[0][0] as string;
    expect(logged).toContain('learner@example.com');
    expect(logged).toContain('482913');
    expect(logged).not.toContain('<h1>');
    warn.mockRestore();
  });
});

describe('EmailService with an API key', () => {
  it('sends through Resend', async () => {
    const send = jest
      .fn()
      .mockResolvedValue({ data: { id: 'e1' }, error: null });
    const service = new EmailService(
      { emails: { send } } as unknown as Resend,
      config({ EMAIL_FROM: 'noreply@example.com' }),
    );

    await service.sendEmail('a@example.com', 'Hi', '<p>Hello</p>');

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@example.com',
        to: 'a@example.com',
      }),
      undefined,
    );
  });
});

describe('RESEND_API_KEY validation', () => {
  const resendError = (env: Record<string, string>) =>
    validationSchema
      .validate(env, { abortEarly: false, allowUnknown: true })
      .error?.details.find((d) => d.path[0] === 'RESEND_API_KEY');

  it('may be blank outside production', () => {
    expect(
      resendError({ NODE_ENV: 'development', RESEND_API_KEY: '' }),
    ).toBeUndefined();
    expect(resendError({ NODE_ENV: 'development' })).toBeUndefined();
  });

  it('is required in production', () => {
    expect(
      resendError({ NODE_ENV: 'production', RESEND_API_KEY: '' }),
    ).toBeDefined();
    expect(resendError({ NODE_ENV: 'production' })).toBeDefined();
  });
});
