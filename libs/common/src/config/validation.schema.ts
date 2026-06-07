import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database
  DATABASE_URL: Joi.string().required(),
  DATABASE_SYNCHRONIZE: Joi.boolean().default(false),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES: Joi.string().required(),
  JWT_REFRESH_EXPIRES: Joi.string().required(),

  // RabbitMQ
  RABBITMQ_URL: Joi.string().required(),
  AUTH_QUEUE: Joi.string().required(),
  USER_QUEUE: Joi.string().required(),
});
