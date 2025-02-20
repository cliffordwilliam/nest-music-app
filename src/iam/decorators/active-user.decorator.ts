import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from '../iam.constants';
import { AccessTokenData } from '../interfaces/access-token-data.interface';
import { Request } from 'express';

export const ActiveUser = createParamDecorator(
  (field: keyof AccessTokenData | undefined, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    const user = request[REQUEST_USER_KEY] as AccessTokenData | undefined;
    return field ? user?.[field] : user;
  },
);
