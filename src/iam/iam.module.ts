import { Module } from '@nestjs/common';
import { HashingService } from './hashing/hashing.service';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [PrismaService, HashingService, AuthenticationService],
  controllers: [AuthenticationController],
})
export class IamModule {}
