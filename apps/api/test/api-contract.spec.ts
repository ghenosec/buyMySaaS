import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AdminGuard } from '../src/common/admin.guard';
import { AuthGuard } from '../src/common/auth.guard';
import { AdminController } from '../src/modules/admin/admin.controller';
import { AdminService } from '../src/modules/admin/admin.service';
import { AnalyticsController } from '../src/modules/analytics/analytics.controller';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { EngagementsController } from '../src/modules/engagements/engagements.controller';
import { EngagementsService } from '../src/modules/engagements/engagements.service';
import { SaasController } from '../src/modules/saas/saas.controller';
import { SaasService } from '../src/modules/saas/saas.service';
import { AuthUser } from '../src/common/auth-user';
import { PrismaService } from '../src/modules/prisma/prisma.service';

class AllowGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    request.user = {
      id: 'user-1',
      email: 'maker@example.com',
      role: 'ADMIN',
    };
    return true;
  }
}
describe('API contracts', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        AuthController,
        SaasController,
        EngagementsController,
        AnalyticsController,
        AdminController,
      ],
      providers: [
        {
          provide: AuthService,
          useValue: {
            googleAuthorizationUrl: jest
              .fn()
              .mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth'),
            loginWithGoogle: jest
              .fn()
              .mockResolvedValue({ token: 'token', user: { id: 'user-1' } }),
            me: jest.fn(),
          },
        },
        {
          provide: SaasService,
          useValue: {
            listPublic: jest.fn().mockResolvedValue({
              data: [],
              meta: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
            }),
            create: jest.fn().mockResolvedValue({ id: 'saas-1' }),
            update: jest.fn(),
            mine: jest.fn(),
            mineOne: jest.fn(),
            archive: jest.fn(),
            submit: jest.fn().mockResolvedValue({ status: 'PENDING_REVIEW' }),
            getPublic: jest.fn(),
          },
        },
        {
          provide: EngagementsService,
          useValue: {
            review: jest.fn().mockResolvedValue({ id: 'review-1' }),
            favorite: jest.fn().mockResolvedValue({ favorited: true }),
            unfavorite: jest.fn(),
            favorites: jest.fn(),
            listReviews: jest.fn(),
            updateReview: jest.fn(),
            deleteReview: jest.fn(),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            record: jest.fn(),
            resolveRedirect: jest.fn(),
            ownerAnalytics: jest.fn(),
            dashboard: jest.fn(),
          },
        },
        {
          provide: AdminService,
          useValue: {
            dashboard: jest.fn(),
            users: jest.fn().mockResolvedValue([]),
            updateUserRole: jest.fn().mockResolvedValue({
              id: 'user-2',
              name: 'User 2',
              email: 'user2@example.com',
              role: 'ADMIN',
            }),
            submissions: jest.fn(),
            submission: jest.fn(),
            approve: jest.fn().mockResolvedValue({ status: 'PUBLISHED' }),
            reject: jest.fn(),
            remove: jest.fn(),
            removeReview: jest.fn(),
            reviews: jest.fn().mockResolvedValue({
              data: [],
              meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
            }),
            approveReview: jest.fn(),
            rejectReview: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        { provide: JwtService, useValue: {} },
        AuthGuard,
        AdminGuard,
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(AllowGuard)
      .overrideGuard(AdminGuard)
      .useClass(AllowGuard)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });
  afterAll(() => app?.close());
  it('bloqueia cadastro por email e senha', () =>
    request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Maker',
        email: 'maker@example.com',
        password: 'password123',
      })
      .expect(410));
  it('lista e cria SaaS', async () => {
    await request(app.getHttpServer()).get('/api/v1/saas').expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/me/saas')
      .send({
        name: 'Produto',
        tagline: 'Uma tagline',
        shortDescription: 'Uma descrição curta que funciona',
        description:
          'Uma descrição completa com conteúdo suficiente para o anúncio.',
        countryCode: 'BR',
        language: 'pt-BR',
        websiteUrl: 'https://example.com',
        pricingType: 'FREE',
        currency: 'BRL',
        tags: [],
        technologies: [],
        categoryIds: ['00000000-0000-0000-0000-000000000001'],
      })
      .expect(201);
  });
  it('cobre engajamento, analytics, submissão e moderação', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/saas/00000000-0000-0000-0000-000000000001/reviews')
      .send({ rating: 5, comment: 'Produto excelente' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/analytics/event')
      .send({
        saasId: '00000000-0000-4000-8000-000000000001',
        type: 'PAGE_VIEW',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/me/saas/saas-1/submit')
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/admin/submissions/saas-1/approve')
      .expect(201);
    await request(app.getHttpServer()).get('/api/v1/admin/users').expect(200);
    await request(app.getHttpServer())
      .patch('/api/v1/admin/users/user-2/role')
      .send({ role: 'ADMIN' })
      .expect(200);
    await request(app.getHttpServer())
      .delete('/api/v1/admin/saas/saas-1')
      .expect(204);
    await request(app.getHttpServer())
      .delete('/api/v1/admin/reviews/review-1')
      .expect(204);
    await request(app.getHttpServer())
      .get('/api/v1/admin/reviews?status=PENDING')
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/admin/reviews/review-1/approve')
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/admin/reviews/review-1/reject')
      .send({ reason: 'Conteúdo ofensivo' })
      .expect(201);
  });
});
