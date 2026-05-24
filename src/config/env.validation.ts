import * as Joi from 'joi';

/** Optional integration vars — empty string in .env is treated as unset. */
const optionalString = () => Joi.string().optional().allow('');

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),

  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

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
