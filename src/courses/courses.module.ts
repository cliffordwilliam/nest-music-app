import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [CoursesController],
  providers: [PrismaService, CoursesService],
})
export class CoursesModule {}
