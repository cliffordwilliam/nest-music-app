import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  BCRYPT_SALT: Joi.string().required(),

  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),

  DATABASE_URL: Joi.string().uri().required(),

  FRONTEND_URL: Joi.string().uri().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_TOKEN_AUDIENCE: Joi.string().required(),
  JWT_TOKEN_ISSUER: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.string().required(),
  JWT_REFRESH_TOKEN_TTL: Joi.string().required(),

  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),

  REDIS_HOST: Joi.string().hostname().required(),
  REDIS_PASSWORD: Joi.string().required(),
  REDIS_PORT: Joi.number().integer().min(1).max(65535).required(),

  STRIPE_SECRET: Joi.string().required(),
}).unknown(true); // Allow additional environment variables (if needed)
