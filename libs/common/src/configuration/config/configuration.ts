export default () => ({
  // Node Environment
  nodeEnv: process.env.NODE_ENV,

  // Ports
  apiGatewayPort: parseInt(process.env.API_GATEWAY_PORT ?? '1111', 10),
  adminGatewayPort: parseInt(process.env.ADMIN_GATEWAY_PORT ?? '2222', 10),

  // Database
  database: {
    url: process.env.DATABASE_URL,
    synchronize: Boolean(process.env.DATABASE_SYNCHRONIZE),
  },

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES,
    emailExpires: process.env.JWT_EMAIL_EXPIRES ?? '1h',
  },

  // Bcrypt
  bcrypt: {
    salt: parseInt(process.env.BCRYPT_SALT ?? '10', 10),
  },

  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
    authQueue: process.env.AUTH_QUEUE,
    userQueue: process.env.USER_QUEUE,
    courseQueue: process.env.COURSE_QUEUE,
    assessmentQueue: process.env.ASSESSMENT_QUEUE,
    subscriptionQueue: process.env.SUBSCRIPTION_QUEUE,
    aiQueue: process.env.AI_QUEUE,
  },

  // Email
  email: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
  },
});
