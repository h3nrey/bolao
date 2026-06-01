import { Controller, Get, Param, UseGuards, Patch, Body, UsePipes, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateUserSchema, UpdateUserDto } from './dto/user.dto';
import { adminUpdateUserSchema, AdminUpdateUserDto } from './dto/admin-update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.usersService.findAll();
  }

  @Patch('me')
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  async updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.usersService.findByIdAndFilter(id, currentUser.id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @UsePipes(new ZodValidationPipe(adminUpdateUserSchema))
  async adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
