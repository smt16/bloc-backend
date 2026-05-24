const envOrUndefined = (value: string | undefined): string | undefined =>
  value === '' || value === undefined ? undefined : value;

export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
  },
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    name: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  aws: {
    region: process.env.AWS_REGION ?? 'us-east-1',
    s3Bucket: envOrUndefined(process.env.S3_BUCKET),
    cloudfrontDomain: envOrUndefined(process.env.CLOUDFRONT_DOMAIN),
  },
  mux: {
    tokenId: envOrUndefined(process.env.MUX_TOKEN_ID),
    tokenSecret: envOrUndefined(process.env.MUX_TOKEN_SECRET),
  },
  posthog: {
    apiKey: envOrUndefined(process.env.POSTHOG_API_KEY),
    host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
    enabled: process.env.POSTHOG_ENABLED === 'true',
  },
  sentry: {
    dsn: envOrUndefined(process.env.SENTRY_DSN),
    environment:
      envOrUndefined(process.env.SENTRY_ENVIRONMENT) ??
      process.env.NODE_ENV ??
      'development',
  },
});

export type AppConfig = ReturnType<typeof import('./configuration').default>;
