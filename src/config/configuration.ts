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
  auth0: {
    /**
     * Auth0 tenant domain — e.g. "bloc-prod.us.auth0.com".
     * Used to derive issuer + JWKS endpoint.
     */
    domain: process.env.AUTH0_DOMAIN,

    /**
     * API audience — the Identifier you set when creating the API in Auth0.
     * Must match the `audience` requested by the mobile client.
     */
    audience: process.env.AUTH0_AUDIENCE,

    /**
     * Namespace for custom claims surfaced in the access token. Must be a URL
     * not on auth0.com (Auth0 strips other namespaces). Default matches our
     * canonical API host. Used to read e.g. `${namespace}roles`, `${namespace}email`.
     *
     * Wire these up via an Auth0 Post-Login / Custom Action:
     *   api.accessToken.setCustomClaim('https://bloc.app/roles', event.authorization?.roles ?? []);
     *   api.accessToken.setCustomClaim('https://bloc.app/email', event.user.email);
     */
    namespace: process.env.AUTH0_CUSTOM_CLAIM_NAMESPACE ?? 'https://bloc.app/',

    /**
     * JWKS cache TTL in ms (defaults to 10 min). Tune for slow networks.
     */
    jwksCacheTtlMs: parseInt(
      process.env.AUTH0_JWKS_CACHE_TTL_MS ?? '600000',
      10,
    ),
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
