import mongoose from 'mongoose';
import request from 'supertest';
import app from '@/app';
import { createVariousPosts } from '@/helpers/post.routes.helpers';


const MONGO_DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/km0-dev';
let token: string;
let token2: string;

beforeAll(async () => {
    await mongoose.connect(MONGO_DB_URI);

    await request(app)
        .post('/api/users')
        .send({
            username: 'demo_user',
            email: 'demo@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
        });

    const login = await request(app)
        .post('/api/login')
        .send({
            email: 'demo@mail.com',
            password: '123456',
        });

    token = login.body.token;

    const login2 = await request(app)
        .post('/api/login')
        .send({
            email: 'demo_2@mail.com',
            password: '123456',
        });

    token2 = login2.body.token;
});

afterAll(async () => {
    await mongoose.connection.dropCollection('users');
    await mongoose.connection.dropCollection('posts');
    await mongoose.connection.close();
});

beforeEach(async () => {
    await mongoose.connection.dropCollection('posts');;
});

describe('GET /api/posts/mine', () => {
    it('Se recuperan con éxito los post del usuario loggeado', async () => {
        await createVariousPosts(token);

        const response = await request(app)
            .get('/api/posts/mine')
            .auth(token, { type: 'bearer' });

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.posts).toHaveLength(3);
        expect(response.body.posts[0].user.username).toBe('demo_user');
    });

    it('Pasando un token caducado, 401 + \'Token inválido o caducado\'', async () => {
        const response = await request(app)
            .get('/api/posts/mine')
            .auth('123', { type: 'bearer' });

        expect(response.statusCode).toBe(401);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Token inválido o caducado');
    })

    it('Un usuario recupera solo sus post', async () => {
        await createVariousPosts(token);
        await createVariousPosts(token2);

        const response = await request(app)
            .get('/api/posts/mine')
            .auth(token, { type: 'bearer' });

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.posts).toHaveLength(3);
        expect(response.body.posts[0].user.username).toBe('demo_user');
    })
});