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
    secret: process.env.JWT_SECRET,
    expires: process.env.JWT_EXPIRES,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES,
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
});
