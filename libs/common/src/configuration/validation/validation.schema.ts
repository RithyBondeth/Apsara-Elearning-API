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
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES: Joi.string().required(),
  JWT_EMAIL_EXPIRES: Joi.string().default('1h'),

  // Bcrypt
  BCRYPT_SALT: Joi.number().default(10),

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

  // AI (Anthropic) — optional; service runs in mock mode without a key
  ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
  ANTHROPIC_MODEL: Joi.string().optional(),

  // Judge0 code execution — optional; grading runs in mock mode without it
  JUDGE0_URL: Joi.string().allow('').optional(),
  JUDGE0_TOKEN: Joi.string().allow('').optional(),

  // Security — optional
  CORS_ORIGINS: Joi.string().allow('').optional(),
  WEBHOOK_SECRET: Joi.string().allow('').optional(),

  // Redis — optional (distributed rate limiting)
  REDIS_URL: Joi.string().allow('').optional(),
});
