process.env.NODE_ENV = 'test';

const request = require('supertest');
const Product = require('./models/Product');
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ id: 'testid', role: 'user' })),
    sign: jest.fn(() => 'mock-token')
}), { virtual: true });

const app = require('./index');

jest.mock('./models/Product', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

describe('Product Service API', () => {
    const token = 'Bearer mock-token';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /api/products - JWT olmadan 401', async () => {
        const res = await request(app).get('/api/products');
        expect(res.status).toBe(401);
    });

    it('POST /api/products - urun ekle', async () => {
        Product.create.mockResolvedValue({ _id: 'p1', name: 'Test Product', price: 10 });

        const res = await request(app)
            .post('/api/products')
            .set('Authorization', token)
            .send({ name: 'Test Product', price: 10 });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Test Product');
    });

    it('GET /api/products - JWT ile', async () => {
        Product.find.mockResolvedValue([{ _id: 'p2', name: 'Test2', price: 20 }]);

        const res = await request(app)
            .get('/api/products')
            .set('Authorization', token);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
