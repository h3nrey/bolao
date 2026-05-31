import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Profile Completion (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  // Mock User profile in database
  const mockUser = {
    id: 'test-user-uuid',
    email: 'test@vlab.org',
    name: 'Test User',
    avatar_url: 'https://avatar.com/test',
    project: null,
    seniority: null,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({
          ...mockUser,
          project: data.project,
          seniority: data.seniority,
          name: data.name,
        });
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  // Generates valid Bearer token for testing authenticated routes
  function getAuthHeader(): string {
    const token = jwtService.sign({ sub: mockUser.id, email: mockUser.email });
    return `Bearer ${token}`;
  }

  describe('PATCH /users/me', () => {
    it('should successfully save profile updates with standard underscore enum values', async () => {
      const updateData = {
        name: 'James Rodrigues',
        project: 'clique_escola',
        seniority: 'bolsista',
      };

      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', getAuthHeader())
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('project', 'clique_escola');
      expect(response.body).toHaveProperty('seniority', 'bolsista');
      expect(response.body).toHaveProperty('name', 'James Rodrigues');
    });

    it('should successfully save profile updates with newly added project values', async () => {
      const projectsToTest = ['esmpu', 'jump', 'inovaula'];

      for (const project of projectsToTest) {
        const updateData = {
          name: 'Test Profile',
          project,
          seniority: 'clt',
        };

        const response = await request(app.getHttpServer())
          .patch('/users/me')
          .set('Authorization', getAuthHeader())
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('project', project);
        expect(response.body).toHaveProperty('seniority', 'clt');
      }
    });

    it('should reject invalid project enum strings with bad request error', async () => {
      const invalidData = {
        name: 'Test Profile',
        project: 'invalid-project-hyphens', // Rejected by Zod validation schema
        seniority: 'bolsista',
      };

      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', getAuthHeader())
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid seniority enum strings with bad request error', async () => {
      const invalidData = {
        name: 'Test Profile',
        project: 'esmpu',
        seniority: 'invalid-seniority-value', // Rejected by Zod validation schema
      };

      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', getAuthHeader())
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
