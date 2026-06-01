import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@vlab.org',
    name: 'Test User',
    avatar_url: 'https://avatar.com/test',
    project: null,
    seniority: null,
  };

  const mockPrismaService = {
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
    prediction: {
      findMany: jest.fn().mockResolvedValue([{ id: 'pred-1' }]),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    predictionPoint: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    predictionItem: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    ranking: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    oauthAccount: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      findMany: jest.fn().mockResolvedValue([mockUser]),
      delete: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({
          ...mockUser,
          name: data.name,
          project: data.project,
          seniority: data.seniority,
          is_admin: data.is_admin,
        });
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.findById(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should successfully update user with standard underscore enum values', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      const dto = {
        name: 'James Rodrigues',
        project: 'clique_escola' as any,
        seniority: 'bolsista' as any,
      };

      const result = await service.update(mockUser.id, dto);

      expect(result.name).toBe('James Rodrigues');
      expect(result.project).toBe('clique_escola');
      expect(result.seniority).toBe('bolsista');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          name: dto.name,
          project: dto.project,
          seniority: dto.seniority,
        },
      });
    });

    it('should successfully update user with newly added project values', async () => {
      const newProjects = ['esmpu', 'jump', 'inovaula'] as const;

      for (const project of newProjects) {
        mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

        const dto = {
          name: 'Updated Name',
          project: project as any,
          seniority: 'clt' as any,
        };

        const result = await service.update(mockUser.id, dto);

        expect(result.project).toBe(project);
        expect(result.seniority).toBe('clt');
      }
    });
  });

  describe('findAll', () => {
    it('should return all users ordered by name', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('adminUpdate', () => {
    it('should successfully update user details as an admin', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      const dto = {
        name: 'Admin Updated',
        project: 'jump' as any,
        seniority: 'pmo' as any,
        is_admin: true,
      };

      const result = await service.adminUpdate(mockUser.id, dto);

      expect(result.name).toBe('Admin Updated');
      expect(result.project).toBe('jump');
      expect(result.seniority).toBe('pmo');
      expect(result.is_admin).toBe(true);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          name: dto.name,
          project: dto.project,
          seniority: dto.seniority,
          is_admin: dto.is_admin,
        },
      });
    });
  });

  describe('deleteUser', () => {
    it('should safely delete user and all dependent relations in a transaction', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.deleteUser(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });
  });
});
