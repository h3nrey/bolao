import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface FindOrCreateUserData {
  email: string;
  name: string;
  avatar_url?: string;
  provider: string;
  provider_account_id: string;
  access_token?: string;
  refresh_token?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async findOrCreateUser(data: FindOrCreateUserData) {
    const {
      email,
      name,
      avatar_url,
      provider,
      provider_account_id,
      access_token,
      refresh_token,
    } = data;

    // 1. Find OauthAccount by provider + provider_account_id
    const oauthAccount = await this.prisma.oauthAccount.findUnique({
      where: {
        provider_provider_account_id: {
          provider,
          provider_account_id,
        },
      },
      include: {
        user: true,
      },
    });

    if (oauthAccount) {
      return oauthAccount.user;
    }

    // 2. If not found, check if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Create OauthAccount linked to existing user
      await this.prisma.oauthAccount.create({
        data: {
          user_id: user.id,
          provider,
          provider_account_id,
          access_token,
          refresh_token,
        },
      });
      return user;
    }

    // 3. If email not found, create User + OauthAccount
    user = await this.prisma.user.create({
      data: {
        email,
        name,
        avatar_url,
        oauth_accounts: {
          create: {
            provider,
            provider_account_id,
            access_token,
            refresh_token,
          },
        },
      },
    });

    const tournaments = await this.prisma.tournament.findMany();
    for (const tournament of tournaments) {
      await this.prisma.ranking.create({
        data: {
          user_id: user.id,
          tournament_id: tournament.id,
          pts_total: 0,
          pts_matches: 0,
        },
      });
    }

    return user;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
