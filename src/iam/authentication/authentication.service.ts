import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { PrismaService } from 'src/prisma.service';
import { UserRole } from '@prisma/client';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
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
    // TODO: pass token later with passport
    return true;
  }
}
