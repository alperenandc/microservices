process.env.NODE_ENV = 'test';

const request = require('supertest');
const Order = require('./models/Order');
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ id: 'testid', role: 'user' })),
    sign: jest.fn(() => 'mock-token')
}), { virtual: true });

const app = require('./index');

jest.mock('./models/Order', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

describe('Order Service API', () => {
    const token = 'Bearer mock-token';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /api/orders - JWT olmadan 401', async () => {
        const res = await request(app).get('/api/orders');
        expect(res.status).toBe(401);
    });

    it('POST /api/orders - siparis ekle', async () => {
        Order.create.mockResolvedValue({ _id: 'o1', item: 'Test Order' });

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', token)
            .send({ item: 'Test Order' });

        expect(res.status).toBe(201);
    });

    it('GET /api/orders - JWT ile', async () => {
        Order.find.mockResolvedValue([{ _id: 'o2', item: 'Test2' }]);

        const res = await request(app)
            .get('/api/orders')
            .set('Authorization', token);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
