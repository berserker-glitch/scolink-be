import express from 'express';
import request from 'supertest';

jest.mock('@/controllers/authController', () => ({
  AuthController: {
    login: jest.fn(),
    signup: jest.fn(),
    refreshToken: jest.fn(),
    getProfile: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn((_req, res) => res.status(200).json({ success: true })),
  },
}));

jest.mock('@/middleware/rateLimiter', () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('@/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    req.user = {
      userId: 'user-1',
      email: 'admin@example.com',
      role: 'center_admin',
      centerId: 'center-1',
    };

    return next();
  }),
}));

const authRoutes = require('@/routes/auth').default;
const { AuthController } = jest.requireMock('@/controllers/authController');
const { authenticate: mockAuthenticate } = jest.requireMock('@/middleware/auth');
const mockLogoutAll = AuthController.logoutAll;

describe('auth routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication for logout-all', async () => {
    const response = await request(app).post('/auth/logout-all').send({});

    expect(response.status).toBe(401);
    expect(mockAuthenticate).toHaveBeenCalledTimes(1);
    expect(mockLogoutAll).not.toHaveBeenCalled();
  });

  it('calls logout-all controller after authentication', async () => {
    const response = await request(app)
      .post('/auth/logout-all')
      .set('Authorization', 'Bearer token')
      .send({});

    expect(response.status).toBe(200);
    expect(mockLogoutAll).toHaveBeenCalledTimes(1);
  });
});
