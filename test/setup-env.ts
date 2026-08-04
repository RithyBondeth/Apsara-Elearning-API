/**
 * Baseline env for unit tests.
 *
 * Importing anything from `@app/common` pulls in ConfigurationModule, whose
 * `ConfigModule.forRoot({ validationSchema })` runs at import time — so a spec
 * that only wants a service class still fails if the developer's `.env` is
 * missing a required key. These defaults keep specs independent of local env;
 * anything already set is left alone.
 */
const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://apsara:apsara@localhost:5432/apsara_test',
  JWT_ACCESS_SECRET: 'test-access-secret-value-at-least-32-chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-value-at-least-32-chars',
  JWT_ACTION_SECRET: 'test-action-secret-value-at-least-32-chars',
  JWT_ACCESS_EXPIRES: '1d',
  JWT_REFRESH_EXPIRES: '7d',
  RABBITMQ_URL: 'amqp://localhost:5672',
  AUTH_QUEUE: 'auth_queue',
  USER_QUEUE: 'user_queue',
  COURSE_QUEUE: 'course_queue',
  ASSESSMENT_QUEUE: 'assessment_queue',
  SUBSCRIPTION_QUEUE: 'subscription_queue',
  AI_QUEUE: 'ai_queue',
  RESEND_API_KEY: 'test-resend-key',
  EMAIL_FROM: 'noreply@apsara.example.com',
  // Joi's .email() validates the TLD against the IANA list, so `.test` fails.
  SUPPORT_TO_EMAIL: 'support@apsara.example.com',
};

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value;
}
