import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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

  @Get('me')
  getProfile(@ActiveUser() user: AccessTokenData) {
    return this.usersService.findOne(user.sub);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
    @ActiveUser() user: AccessTokenData,
  ) {
    // Check if the user is an admin OR updating their own account
    if (user.role !== UserRole.ADMIN && user.sub !== id) {
      throw new ForbiddenException('You can only update your own details.');
    }

    return this.usersService.update(+id, updateUserDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
