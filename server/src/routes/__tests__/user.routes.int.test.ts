import mongoose from 'mongoose';
import request from 'supertest';
import app from '@/app';
import { UserModel } from '@/models/user.model';
import { createUser } from '@/services/user.service';

const MONGO_DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/km0-test'

beforeAll(async () => {
    // Conectarme a la base de datos
    // antes de lanzar cualquier test
    mongoose.connect(MONGO_DB_URI);
});

afterAll(async () => {
    // Limpiar la base de datos y desconectar
    // después de todos los test
    await mongoose.connection.dropCollection('users');
    await mongoose.connection.close();
});

describe('POST /api/users', () => {
    afterEach(async () => {
        // Antes de cada test borrar todos los registros de
        // la colección de users
        await mongoose.connection.dropCollection('users');
    });

    it('crear un usuario si el email no existe', async () => {
        const result = await request(app)
            .post('/api/users')
            .send({
                username: 'demo_user',
                email: 'demo@mail.com',
                birthdate: '1990-01-01',
                password: '123456',
            });

        expect(result.statusCode).toBe(201);
        expect(result.body.user.email).toBe('demo@mail.com');
    });

    it('devuelve 409 si el email ya está registrado', async () => {
        await UserModel.create({
            username: 'demo_user',
            email: 'demo@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
        });

        const result = await request(app)
            .post('/api/users')
            .send({
                username: 'demo_user',
                email: 'demo@mail.com',
                birthdate: '1990-01-01',
                password: '123456',
            });

        expect(result.statusCode).toBe(409);
        expect(result.body.message).toBe('Email ya registrado');
    });
});

describe('POST /api/login', () => {
    beforeEach(async () => {
        await mongoose.connection.dropCollection('users');

        await createUser({
            username: 'demo_user',
            email: 'demo@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
        });
    })

    it('login exitoso con credenciales válidas', async () => {
        const result = await request(app)
            .post('/api/login')
            .send({
                email: 'demo@mail.com',
                password: '123456',
            })

        expect(result.statusCode).toBe(201);
        expect(result.body.status).toEqual('logged');
        expect(result.body.token).not.toBeNull();
    });

    it('login incorrecto con email inexistente', async () => {
        const result = await request(app)
            .post('/api/login')
            .send({
                email: 'dem@mail.com',
                password: '123456',
            })

        expect(result.statusCode).toBe(401);
        expect(result.body.message).toEqual('Credenciales incorrectas');
    });

    it('login incorrecto con password incorrecta', async () => {
        const result = await request(app)
            .post('/api/login')
            .send({
                email: 'demo@mail.com',
                password: '12345',
            })

        expect(result.statusCode).toBe(401);
        expect(result.body.message).toEqual('Credenciales incorrectas');
    });
});

describe('GET /api/:username/followers', () => {
    let token: string;
    let username: string;

    let token2: string

    beforeAll(async () => {
        await mongoose.connection.dropCollection('users');

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
        username = login.body.user.username;

        const login2 = await request(app)
            .post('/api/login')
            .send({
                email: 'demo_user_2@mail.com',
                password: '123456',
            });

        token2 = login2.body.token;

        await request(app)
            .post('/api/follow/demo_user_2')
            .auth(token, { type: 'bearer' });
    })

    it('Se devuelven los seguidores del usuario PRIVADO con detalles, consultado por el propietario', async () => {
        const response = await request(app)
            .get('/api/demo_user_2/followers')
            .auth(token2, { type: 'bearer' });

        const response2 = await request(app)
            .get('/api/demo_user/followers')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body).toHaveProperty('followers');
        expect(response.body.followers).toHaveLength(1);
        expect(response.body.followers[0].following).toBe(1);
        expect(response.body.followers[0].followers).toBe(0);
        expect(response2.body.followers).toHaveLength(0);
    });

    it('Un usuario distinto al propietario, puede recuperar los seguidores del usuario PÚBLICO', async () => {
        const response = await request(app)
            .get('/api/demo_user_2/followers')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body).toHaveProperty('followers');
        expect(response.body.followers).toHaveLength(1);
        expect(response.body.followers[0].following).toBe(1);
        expect(response.body.followers[0].followers).toBe(0);
    });

    it('Sin token no se recuperan resultados', async () => {
        const response = await request(app)
            .get('/api/demo_user/followers');

        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Invalid token');
    });

    it('Se intentan recuperar los seguidores de un usuario inexistente', async () => {
        const response = await request(app)
            .get('/api/demo_user_fake/followers')
            .auth(token2, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('User not found');
    });

    it('Un usuario distinto al propietario, quiere recuperar los seguidores del usuario privado', async () => {
        const response = await request(app)
            .get('/api/demo_user/followers')
            .auth(token2, { type: 'bearer' });

        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Forbidden');
    });
});