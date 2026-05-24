import * as Joi from 'joi';

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
  S3_BUCKET: Joi.string().optional(),
  CLOUDFRONT_DOMAIN: Joi.string().optional(),

  MUX_TOKEN_ID: Joi.string().optional(),
  MUX_TOKEN_SECRET: Joi.string().optional(),

  POSTHOG_API_KEY: Joi.string().optional(),
  POSTHOG_HOST: Joi.string().default('https://us.i.posthog.com'),
  POSTHOG_ENABLED: Joi.string().valid('true', 'false').default('false'),

  SENTRY_DSN: Joi.string().optional().allow(''),
  SENTRY_ENVIRONMENT: Joi.string().optional(),
});
