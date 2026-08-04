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
    actionSecret:
      process.env.JWT_ACTION_SECRET ?? process.env.JWT_ACCESS_SECRET,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES,
    emailExpires: process.env.JWT_EMAIL_EXPIRES ?? '1h',
    issuer: process.env.JWT_ISSUER ?? 'apsara-elearning',
    audience: process.env.JWT_AUDIENCE ?? 'apsara-elearning-web',
  },

  // Bcrypt
  bcrypt: {
    salt: parseInt(process.env.BCRYPT_SALT ?? '12', 10),
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
  support: {
    // Falls back to the sender address so a fresh clone boots without extra
    // setup — same pattern as jwt.actionSecret above. `||` not `??`: the schema
    // allows an empty string, which must fall back too.
    toEmail: process.env.SUPPORT_TO_EMAIL || process.env.EMAIL_FROM,
  },

  // AI
  ai: {
    provider: process.env.AI_PROVIDER ?? 'anthropic',
    model: process.env.AI_MODEL ?? process.env.ANTHROPIC_MODEL,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS ?? '4096', 10),
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL,
    openaiBaseUrl: process.env.OPENAI_BASE_URL,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    deepseekModel: process.env.DEEPSEEK_MODEL,
    deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL,
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL,
    geminiBaseUrl: process.env.GEMINI_BASE_URL,
  },

  // Code execution (Judge0) — optional; grading runs in mock mode without it
  judge0: {
    url: process.env.JUDGE0_URL,
    token: process.env.JUDGE0_TOKEN,
  },

  // CORS — comma-separated allowed origins; falls back to "*" if unset
  cors: {
    origins: process.env.CORS_ORIGINS,
  },

  // Billing. `provider` selects the rail the subscription flow drives — see
  // apps/subscription-service/src/payment/payment-provider.interface.ts.
  // Stripe does not operate in Cambodia, so this is expected to change once a
  // local rail (ABA PayWay, Bakong/KHQR, Wing) is implemented.
  payments: {
    provider: process.env.PAYMENT_PROVIDER ?? 'stripe',
  },

  // Stripe Billing
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  web: {
    appUrl: process.env.WEB_APP_URL ?? 'http://localhost:3000',
  },

  // Redis — optional; rate limiting uses it across replicas when set
  redis: {
    url: process.env.REDIS_URL,
  },
});
