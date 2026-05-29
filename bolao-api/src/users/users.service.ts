import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByIdAndFilter(id: string, loggedInUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const canEdit = id === loggedInUserId;

    if (canEdit) {
      return {
        ...user,
        can_edit: true,
      };
    }

    return {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      project: user.project,
      seniority: user.seniority,
      can_edit: false,
    };
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, data: UpdateUserDto) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        project: data.project as any,
        seniority: data.seniority as any,
      },
    });
  }
}
