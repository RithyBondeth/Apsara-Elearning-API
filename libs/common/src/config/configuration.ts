export default () => ({
  // Node Environment
  nodeEnv: process.env.NODE_ENV,

  // Database
  database: {
    url: process.env.DATABASE_URL,
    synchronize: Boolean(process.env.DATABASE_SYNCHRONIZE),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expires: process.env.JWT_EXPIRES,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES,
    emailExpires: process.env.JWT_EMAIL_EXPIRES,
  },

  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
  },
});
