process.env.NODE_ENV = 'test';

const request = require('supertest');
const User = require('./models/User');
const app = require('./index');

jest.mock('./models/User', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn()
}));

describe('User Service API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Register - POST /api/users', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({ _id: 'u1', username: 'testuser', role: 'user' });

        const res = await request(app)
            .post('/api/users')
            .send({ username: 'testuser', password: 'testpass' });

        expect(res.status).toBe(201);
        expect(res.body.username).toBe('testuser');
    });

    it('Login - POST /api/users/login', async () => {
        User.findOne.mockResolvedValue({
            _id: 'u2',
            username: 'loginuser',
            role: 'user',
            matchPassword: jest.fn().mockResolvedValue(true)
        });

        const res = await request(app)
            .post('/api/users/login')
            .send({ username: 'loginuser', password: 'testpass' });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it('GET /api/users - JWT olmadan 401', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).toBe(401);
    });
});
