import mongoose from 'mongoose';
import request from 'supertest';
import app from '@/app';
import { createUser, loginUser } from '@/services/user.service';
import { LoginResponseDTO } from '@/dtos/login-user.dto';

const MONGO_DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/km0-test'

let token1: LoginResponseDTO;
let token2: LoginResponseDTO;

beforeAll(async () => {
    mongoose.connect(MONGO_DB_URI);

    await createUser({
        username: 'demo_user',
        email: 'demo@mail.com',
        birthdate: '1990-01-01',
        password: '123456',
        isPublic: false,
    });

    token1 = await loginUser({
        email: 'demo@mail.com',
        password: '123456',
    });

    await createUser({
        username: 'demo_user_2',
        email: 'demo_2@mail.com',
        birthdate: '1990-01-01',
        password: '123456',
        bio: 'La bio de este tío',
    });

    token2 = await loginUser({
        email: 'demo_2@mail.com',
        password: '123456',
    })
});

afterAll(async () => {
    await mongoose.connection.dropCollection('users');
    await mongoose.connection.close();
});

// beforeEach(async () => {
//     await mongoose.connection.dropCollection('users')
// })

describe('GET /api/:username', () => {
    it('Dueño de perfil privado obtiene todos los datos', async () => {
        const profile = await request(app)
            .get('/api/demo_user')
            .auth(token1.token, { type: 'bearer' });

        expect(profile.statusCode).toBe(200);
        expect(profile.body.status).toBe('ok');
        expect(profile.body.profile.email).toBe('demo@mail.com');
    });

    it('Perfil PÚBLICO recuperado por usuario NO LOGGEADO', async () => {
        const profile = await request(app)
            .get('/api/demo_user_2');

        expect(profile.statusCode).toBe(200);
        expect(profile.body.status).toBe('ok');
        expect(profile.body.profile.email).toBe('demo_2@mail.com');
        expect(profile.body.profile).toHaveProperty('bio');
        expect(profile.body.profile.bio).toBe('La bio de este tío');
    });

    it('Perfil PÚBLICO recuperado por usuario LOGGEADO', async () => {
        const profile = await request(app)
            .get('/api/demo_user_2')
            .auth(token1.token, { type: 'bearer' });

        expect(profile.statusCode).toBe(200);
        expect(profile.body.status).toBe('ok');
        expect(profile.body.profile.email).toBe('demo_2@mail.com');
        expect(profile.body.profile).toHaveProperty('email');
        expect(profile.body.profile).toHaveProperty('birthdate');
        expect(profile.body.profile).toHaveProperty('bio');
        expect(profile.body.profile.bio).toBe('La bio de este tío');
    });

    it('Perfil PRIVADO recuperado parcialmente por usuario NO LOGGEADO', async () => {
        const profile = await request(app)
            .get('/api/demo_user');

        expect(profile.statusCode).toBe(200);
        expect(profile.body.status).toBe('ok');
        expect(profile.body.profile.username).toBe('demo_user');
        expect(profile.body.profile).not.toHaveProperty('email');
        expect(profile.body.profile).not.toHaveProperty('birthdate');
    });

    it('Perfil PRIVADO recuperado parcialmente por usuario LOGGEADO', async () => {
        const profile = await request(app)
            .get('/api/demo_user')
            .auth(token2.token, { type: 'bearer' });

        expect(profile.statusCode).toBe(200);
        expect(profile.body.status).toBe('ok');
        expect(profile.body.profile).toHaveProperty('username');
        expect(profile.body.profile.username).toBe('demo_user');
        expect(profile.body.profile).not.toHaveProperty('email');
        expect(profile.body.profile).not.toHaveProperty('birthdate');
    });
})

describe('INVALID GET /api/:username', () => {
    it('Error 404 en usuario no encontrado', async () => {
        const profile = await request(app)
            .get('/api/demo_user_fake')
            .auth(token1.token, { type: 'bearer' });

        expect(profile.statusCode).toBe(404);
        expect(profile.body.message).toBe('User not found');
    });
});