import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma.service';
import jwtConfig from '../config/jwt.config';
import { HashingService } from '../hashing/hashing.service';
import { AccessTokenData } from '../interfaces/access-token-data.interface';
import { RefreshTokenData } from '../interfaces/refresh-token-data.interface';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { RefreshTokenIdsStorage } from './refresh-token-ids.storage';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const isUserExist = await this.prisma.user.findUnique({
      where: { email: signUpDto.email },
    });
    if (isUserExist) {
      throw new UnauthorizedException('Email is already in use');
    }
    const email = signUpDto.email;
    const password = await this.hashingService.hash(signUpDto.password);

    await this.prisma.user.create({
      data: {
        email,
        name: email,
        password,
        role: UserRole.STUDENT,
      },
    });
  }

  async signIn(signInDto: SignInDto) {
    const isUserExist = await this.prisma.user.findUnique({
      where: { email: signInDto.email },
    });
    if (!isUserExist) {
      throw new UnauthorizedException('User does not exists');
    }
    const isPassOk = await this.hashingService.compare(
      signInDto.password,
      isUserExist.password,
    );
    if (!isPassOk) {
      throw new UnauthorizedException('Password does not match');
    }
    return await this.makeTokens(isUserExist);
  }

  private async makeTokens(isUserExist: User) {
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: isUserExist.id,
          email: isUserExist.email,
          role: isUserExist.role,
        } as AccessTokenData,
        {
          audience: this.jwtConfiguration.audience,
          issuer: this.jwtConfiguration.issuer,
          secret: this.jwtConfiguration.secret,
          expiresIn: this.jwtConfiguration.accessTokenTtl,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: isUserExist.id,
          refreshTokenId,
        } as RefreshTokenData,
        {
          audience: this.jwtConfiguration.audience,
          issuer: this.jwtConfiguration.issuer,
          secret: this.jwtConfiguration.secret,
          expiresIn: this.jwtConfiguration.refreshTokenTtl,
        },
      ),
    ]);
    await this.refreshTokenIdsStorage.insert(isUserExist.id, refreshTokenId); // remember tiket given out
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub, refreshTokenId }: RefreshTokenData =
        await this.jwtService.verifyAsync(
          refreshTokenDto.refreshToken,
          this.jwtConfiguration,
        );
      const isUserExist = await this.prisma.user.findUniqueOrThrow({
        where: { id: sub },
      });
      // check if user holds tiket that i just gave them
      const isValid = await this.refreshTokenIdsStorage.validate(
        isUserExist.id,
        refreshTokenId,
      );
      if (isValid) {
        await this.refreshTokenIdsStorage.invalidate(isUserExist.id); // burn old tiket
      } else {
        throw new Error('Refresh token is invalid'); // ur tiket is fake
      }
      return this.makeTokens(isUserExist);
    } catch {
      throw new UnauthorizedException();
    }
  }
}
