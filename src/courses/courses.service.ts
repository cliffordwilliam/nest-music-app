import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from 'src/prisma.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateInstructor(instructorId: number) {
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    if (instructor.role !== UserRole.INSTRUCTOR) {
      throw new BadRequestException('User is not an instructor');
    }
  }

  async create(createCourseDto: CreateCourseDto) {
    await this.validateInstructor(createCourseDto.instructorId);

    return await this.prisma.course.create({
      data: createCourseDto,
    });
  }

  findAll(paginationQuery: PaginationQueryDto) {
    const { limit, offset } = paginationQuery;
    return this.prisma.course.findMany({
      skip: offset,
      take: limit,
    });
  }

  async findOne(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`Course #${id} not found`);
    }
    return course;
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    await this.findOne(id);

    if (updateCourseDto.instructorId) {
      await this.validateInstructor(updateCourseDto.instructorId);
    }

    return await this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.course.delete({
      where: { id },
    });
  }
}
