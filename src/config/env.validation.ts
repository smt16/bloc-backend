import * as Joi from 'joi';

/** Optional integration vars — empty string in .env is treated as unset. */
const optionalString = () => Joi.string().optional().allow('');

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: optionalString().description(
    'Comma-separated allowed CORS origins (native apps ignore CORS)',
  ),

  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  // Allow an empty password for local Postgres using trust/peer auth.
  DATABASE_PASSWORD: Joi.string().allow('').required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),

  AUTH0_DOMAIN: Joi.string()
    .hostname()
    .required()
    .description('Auth0 tenant domain, e.g. bloc-prod.us.auth0.com'),
  AUTH0_AUDIENCE: Joi.string()
    .uri()
    .required()
    .description(
      'API Identifier registered in Auth0, e.g. https://api.bloc.app',
    ),
  AUTH0_CLIENT_ID: optionalString().description(
    'Confidential Auth0 app client ID for email/password proxy',
  ),
  AUTH0_CLIENT_SECRET: optionalString().description(
    'Confidential Auth0 app client secret for email/password proxy',
  ),
  AUTH0_DB_CONNECTION: optionalString().description(
    'Auth0 Database connection name (default Username-Password-Authentication)',
  ),
  AUTH0_PASSWORD_GRANT_SCOPE: optionalString().description(
    'Scopes for password-realm token exchange',
  ),
  AUTH0_CUSTOM_CLAIM_NAMESPACE: Joi.string()
    .uri()
    .default('https://bloc.app/')
    .description(
      'Namespace prefix for custom claims surfaced in access tokens',
    ),
  AUTH0_JWKS_CACHE_TTL_MS: Joi.number().integer().min(0).default(600000),

  AWS_REGION: Joi.string().default('us-east-1'),
  S3_BUCKET: optionalString(),
  CLOUDFRONT_DOMAIN: optionalString(),

  MUX_TOKEN_ID: optionalString(),
  MUX_TOKEN_SECRET: optionalString(),

  POSTHOG_API_KEY: optionalString(),
  POSTHOG_HOST: Joi.string().default('https://us.i.posthog.com'),
  POSTHOG_ENABLED: Joi.string().valid('true', 'false').default('false'),

  SENTRY_DSN: optionalString(),
  SENTRY_ENVIRONMENT: optionalString(),
});
