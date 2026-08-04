import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Ports
  API_GATEWAY_PORT: Joi.number().port().default(1111),
  ADMIN_GATEWAY_PORT: Joi.number().port().default(2222),

  // Database
  DATABASE_URL: Joi.string().required(),
  DATABASE_SYNCHRONIZE: Joi.boolean().default(false),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES: Joi.string().required(),
  JWT_ACTION_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().min(32).optional(),
  }),
  JWT_EMAIL_EXPIRES: Joi.string().default('1h'),
  JWT_ISSUER: Joi.string().default('apsara-elearning'),
  JWT_AUDIENCE: Joi.string().default('apsara-elearning-web'),

  // Bcrypt
  BCRYPT_SALT: Joi.number().integer().min(10).max(15).default(12),

  // RabbitMQ
  RABBITMQ_URL: Joi.string().required(),
  AUTH_QUEUE: Joi.string().required(),
  USER_QUEUE: Joi.string().required(),
  COURSE_QUEUE: Joi.string().required(),
  ASSESSMENT_QUEUE: Joi.string().required(),
  SUBSCRIPTION_QUEUE: Joi.string().required(),
  AI_QUEUE: Joi.string().required(),

  // Email
  RESEND_API_KEY: Joi.string().required(),
  EMAIL_FROM: Joi.string().required(),
  SUPPORT_TO_EMAIL: Joi.string().email().required(),

  // AI — optional; providers run in mock mode without their keys
  AI_PROVIDER: Joi.string()
    .valid('anthropic', 'openai', 'deepseek', 'gemini')
    .default('anthropic'),
  AI_MODEL: Joi.string().optional(),
  AI_MAX_TOKENS: Joi.number().default(4096),
  ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
  ANTHROPIC_MODEL: Joi.string().optional(),
  OPENAI_API_KEY: Joi.string().allow('').optional(),
  OPENAI_MODEL: Joi.string().optional(),
  OPENAI_BASE_URL: Joi.string().uri().optional(),
  DEEPSEEK_API_KEY: Joi.string().allow('').optional(),
  DEEPSEEK_MODEL: Joi.string().optional(),
  DEEPSEEK_BASE_URL: Joi.string().uri().optional(),
  GEMINI_API_KEY: Joi.string().allow('').optional(),
  GEMINI_MODEL: Joi.string().optional(),
  GEMINI_BASE_URL: Joi.string().uri().optional(),

  // Judge0 code execution — optional; grading runs in mock mode without it
  JUDGE0_URL: Joi.string().allow('').optional(),
  JUDGE0_TOKEN: Joi.string().allow('').optional(),

  // Security — optional
  CORS_ORIGINS: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(1).required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  // subscription-service enforces these at startup in production. They stay
  // optional here so unrelated services do not need billing credentials.
  STRIPE_SECRET_KEY: Joi.string()
    .pattern(/^sk_(test|live)_/)
    .allow('')
    .optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string()
    .pattern(/^whsec_/)
    .allow('')
    .optional(),
  WEB_APP_URL: Joi.string().uri().default('http://localhost:3000'),

  // Redis — optional (distributed rate limiting)
  REDIS_URL: Joi.string().allow('').optional(),
}).custom((environment: Record<string, unknown>, helpers) => {
  if (environment.JWT_ACCESS_SECRET === environment.JWT_REFRESH_SECRET) {
    return helpers.error('any.invalid', {
      message: 'JWT access and refresh secrets must be different',
    });
  }
  if (
    environment.JWT_ACTION_SECRET &&
    (environment.JWT_ACTION_SECRET === environment.JWT_ACCESS_SECRET ||
      environment.JWT_ACTION_SECRET === environment.JWT_REFRESH_SECRET)
  ) {
    return helpers.error('any.invalid', {
      message: 'JWT action secret must be different from session secrets',
    });
  }
  return environment;
});
