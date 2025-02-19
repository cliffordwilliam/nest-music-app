import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing');
  }

  const audience = process.env.JWT_TOKEN_AUDIENCE;
  if (!audience) {
    throw new Error('JWT_TOKEN_AUDIENCE environment variable is missing');
  }

  const issuer = process.env.JWT_TOKEN_ISSUER;
  if (!issuer) {
    throw new Error('JWT_TOKEN_ISSUER environment variable is missing');
  }

  const accessTokenTtl = Number(process.env.JWT_ACCESS_TOKEN_TTL);
  if (isNaN(accessTokenTtl)) {
    throw new Error('JWT_ACCESS_TOKEN_TTL must be a valid number');
  }

  const refreshTokenTtl = Number(process.env.JWT_REFRESH_TOKEN_TTL);
  if (isNaN(refreshTokenTtl)) {
    throw new Error('JWT_REFRESH_TOKEN_TTL must be a valid number');
  }

  return {
    secret,
    audience,
    issuer,
    accessTokenTtl,
    refreshTokenTtl,
  };
});
