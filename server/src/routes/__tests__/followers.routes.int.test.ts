import app from '@/app';
import { UserModel } from '@/models/user.model';
import mongoose from 'mongoose';
import request from 'supertest';

const MONGO_DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/km0-dev';
let token: string;
let username: string;

let token2: string;

beforeAll(async () => {
    await mongoose.connect(MONGO_DB_URI);

    await request(app)
        .post('/api/users')
        .send({
            username: 'demo_user',
            email: 'demo_user@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
            isPublic: false,
        });

    await request(app)
        .post('/api/users')
        .send({
            username: 'demo_user_2',
            email: 'demo_user_2@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
        });

    await request(app)
        .post('/api/users')
        .send({
            username: 'demo_user_3',
            email: 'demo_user_3@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
        });

    const login = await request(app)
        .post('/api/login')
        .send({
            email: 'demo_user@mail.com',
            password: '123456',
        });

    token = login.body.token;
    username = login.body.user.username;

    const login2 = await request(app)
        .post('/api/login')
        .send({
            email: 'demo_user_2@mail.com',
            password: '123456',
        });

    token2 = login2.body.token;

    const login3 = await request(app)
        .post('/api/login')
        .send({
            email: 'demo_user_3@mail.com',
            password: '123456',
        });
});

afterAll(async () => {
    await mongoose.connection.dropCollection('users');
    await mongoose.connection.close();
});

beforeEach(async () => {
    await UserModel.updateMany({}, { $set: { followers: [], followRequests: [], following: [] } });
})

describe('VALID DELETE /api/followers/:username', () => {
    it('Petición para eliminar seguidor exitosa', async () => {
        await request(app)
            .post('/api/follow/demo_user_2')
            .auth(token, { type: 'bearer' });

        const response = await request(app)
            .delete('/api/followers/demo_user')
            .auth(token2, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('deleted');
        expect(response.body.message).toBe(`User ${username} no longer following you`);
    });
});

describe('INVALID DELETE /api/followers/:username', () => {
    it('Sin token no se puede realizar operación', async () => {
        const response = await request(app)
            .delete('/api/followers/demo_user');

        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Invalid token');
    });

    it('El usuario que se quiere eliminar NO es seguidor', async () => {
        const response = await request(app)
            .delete('/api/followers/demo_user')
            .auth(token2, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('This user is not following you');
    });

    it('El usuario que se quiere eliminar no existe', async () => {
        const response = await request(app)
            .delete('/api/followers/demo_user_fake')
            .auth(token2, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('User not found');
    });

    it('No puedes eliminarte a ti mismo de tus seguidores, porque no te puedes seguir a ti mismo', async () => {
        const response = await request(app)
            .delete('/api/followers/demo_user')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Cannot delete yourself, because you can\'t follow yourself');
    });
});