import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

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

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async adminUpdate(id: string, data: AdminUpdateUserDto) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        project: data.project !== undefined ? (data.project as any) : undefined,
        seniority: data.seniority !== undefined ? (data.seniority as any) : undefined,
        is_admin: data.is_admin,
      },
    });
  }

  async deleteUser(id: string) {
    await this.findById(id);

    return this.prisma.$transaction(async (tx) => {
      // Find all predictions for the user to delete prediction points and items
      const predictions = await tx.prediction.findMany({
        where: { user_id: id },
        select: { id: true },
      });
      const predictionIds = predictions.map((p) => p.id);

      if (predictionIds.length > 0) {
        await tx.predictionPoint.deleteMany({
          where: { prediction_id: { in: predictionIds } },
        });
        await tx.predictionItem.deleteMany({
          where: { prediction_id: { in: predictionIds } },
        });
        await tx.prediction.deleteMany({
          where: { id: { in: predictionIds } },
        });
      }

      // Delete rankings
      await tx.ranking.deleteMany({
        where: { user_id: id },
      });

      // Delete oauth accounts
      await tx.oauthAccount.deleteMany({
        where: { user_id: id },
      });

      // Delete the user
      return tx.user.delete({
        where: { id },
      });
    });
  }
}
