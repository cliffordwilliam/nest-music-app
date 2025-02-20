import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { PrismaService } from 'src/prisma.service';
import { UserRole } from '@prisma/client';
import { SignInDto } from './dto/sign-in.dto';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenData } from '../interfaces/access-token-data.interface';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async signUp(signUpDto: SignUpDto) {
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
    const accessToken = await this.jwtService.signAsync(
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
    );
    return {
      accessToken,
    };
  }
}
