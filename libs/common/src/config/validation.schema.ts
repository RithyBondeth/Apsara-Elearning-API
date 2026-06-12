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
});
