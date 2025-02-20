import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/iam/authorization/role.decorator';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { AccessTokenData } from 'src/iam/interfaces/access-token-data.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(UserRole.INSTRUCTOR)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles(UserRole.STUDENT)
  @Get('profile')
  getProfile(@ActiveUser() user: AccessTokenData) {
    // todo: return all user item! not just payload, use sub to find one
    return user;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
