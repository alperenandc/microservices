process.env.NODE_ENV = 'test';

const request = require('supertest');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const app = require('./app');
const Log = require('./models/Log');

jest.mock('axios');
jest.mock('./models/Log', () => ({
    create: jest.fn(),
    find: jest.fn(),
    deleteMany: jest.fn()
}));

const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_GIZLI_ANAHTAR_123';

describe('Dispatcher API Gateway Testleri', () => {
    const token = jwt.sign({ id: 'u1', role: 'user' }, JWT_SECRET);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Yetkisiz Istek (No Token) - 401 Hatasi Donmeli', async () => {
        const response = await request(app).get('/api/users');
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access Denied: No Token Provided');
    });

    it('Yetkili Istek (With Token) - Istek User Servicee gitmeli', async () => {
        axios.mockResolvedValue({ status: 200, data: { message: 'Mock response' } });

        const response = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Mock response');
    });

    it('Istek geldiginde log kaydi olusturmali', async () => {
        axios.mockResolvedValue({ status: 200, data: {} });
        Log.create.mockResolvedValue({});

        await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${token}`);

        expect(Log.create).toHaveBeenCalledWith(expect.objectContaining({
            method: 'GET',
            url: '/api/users'
        }));
    });
});
