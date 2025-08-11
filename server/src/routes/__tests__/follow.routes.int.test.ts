import app from '@/app';
import { UserModel } from '@/models/user.model';
import mongoose from 'mongoose';
import request from 'supertest';

const MONGO_DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/km0-dev';
let token: string;
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

    const login = await request(app)
        .post('/api/login')
        .send({
            email: 'demo_user@mail.com',
            password: '123456',
        });

    token = login.body.token;

    const login2 = await request(app)
        .post('/api/login')
        .send({
            email: 'demo_user_2@mail.com',
            password: '123456',
        });

    token2 = login2.body.token;
});

afterAll(async () => {
    await mongoose.connection.dropCollection('users');
    await mongoose.connection.close();
});

beforeEach(async () => {
    await UserModel.updateMany({}, { $set: { followers: [], followRequests: [] } });
})

describe.only('VALID POST /api/follow/:username', () => {
    it('Cualquier tipo de usuario puede seguir directamente a un usuario público', async () => {
        const response = await request(app)
            .post('/api/follow/demo_user_2')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('followed');
        expect(response.body.message).toBe('Following demo_user_2');
    });

    it('Cualquier tipo de usuario puede hacer petición de seguimiento a un usuario privado', async () => {
        const response = await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('pending');
        expect(response.body.message).toBe('Wait for user response');
    });

    it.only('Cuando se sigue un perfil público, el perfil demandante y el demandado, reflejan los cambios', async () => {
        await request(app)
            .post('/api/follow/demo_user_2')
            .auth(token, { type: 'bearer' });

        const requestingUser = await request(app)
            .get('/api/demo_user')
            .auth(token, { type: 'bearer' });

        const requestedUser = await request(app)
            .get('/api/demo_user_2')
            .auth(token2, { type: 'bearer' });

        expect(requestingUser.status).toBe(200);
        expect(requestingUser.body.profile).toHaveProperty('followers');
        expect(requestingUser.body.profile).toHaveProperty('following');
        expect(requestingUser.body.profile).toHaveProperty('followRequests');
        expect(requestingUser.body.profile.following).toBe(1);

        expect(requestedUser.status).toBe(200);
        expect(requestedUser.body.profile).toHaveProperty('followers');
        expect(requestedUser.body.profile).toHaveProperty('following');
        expect(requestedUser.body.profile).toHaveProperty('followRequests');
        expect(requestedUser.body.profile.followers).toBe(1);
    });
});

describe('INVALID POST /api/follow/:username', () => {
    it('Un usuario anónimo no puede hacer petición de seguimiento', async () => {
        const response = await request(app)
            .post('/api/follow/demo_user');

        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Invalid token');
    });

    it('Un usuario no puede seguirse a sí mismo', async () => {
        const response = await request(app)
            .post('/api/follow/demo_user')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Cannot follow yourself');
    });

    // 3. 
    it('El usuario que se quiere seguir no existe', async () => {
        const response = await request(app)
            .post('/api/follow/demo_user_fake')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('User not found');
    });

    // 4. Ya se sigue al usuario público
    it('Ya se sigue al usuario público', async () => {
        const response = await request(app)
            .post('/api/follow/demo_user_2')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Already following');
    });
    // 5. Ya existe una petición de seguimiento al usuario privado
    it('Ya existe una petición de seguimiento al usuario privado', async () => {
        const response = await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Already requested. Wait for user response');
    });
});