import mongoose from 'mongoose';
import request from 'supertest';
import app from '@/app';
import { UserModel } from '@/models/user.model';
import { createUser, loginUser } from '@/services/user.service';
import { LoginResponseDTO } from '@/dtos/login-user.dto';

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

beforeEach(async () => {
    // Antes de cada test borrar todos los registros de
    // la colección de users
    await mongoose.connection.dropCollection('users')
})

describe('POST /api/users', () => {
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
        await createUser({
            username: 'demo_user',
            email: 'demo@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
        })
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
})

describe('GET /api/:username', () => {
    beforeEach(async () => {
        await createUser({
            username: 'demo_user',
            email: 'demo@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
            isPublic: false,
        })

        await createUser({
            username: 'demo_user_2',
            email: 'demo_2@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
            bio: 'La bio de este tío',
        })
    })

    it('Dueño de perfil privado obtiene todos los datos', async () => {
        const result = await request(app)
            .post('/api/login')
            .send({
                email: 'demo@mail.com',
                password: '123456',
            });

        const profile = await request(app)
            .get('/api/demo_user')
            .auth(result.body.token, { type: 'bearer' });

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
        const result = await request(app)
            .post('/api/login')
            .send({
                email: 'demo@mail.com',
                password: '123456',
            });

        const profile = await request(app)
            .get('/api/demo_user_2')
            .auth(result.body.token, { type: 'bearer' });

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
        const result = await request(app)
            .post('/api/login')
            .send({
                email: 'demo_2@mail.com',
                password: '123456',
            });

        const profile = await request(app)
            .get('/api/demo_user')
            .auth(result.body.token, { type: 'bearer' });

        expect(profile.statusCode).toBe(200);
        expect(profile.body.status).toBe('ok');
        expect(profile.body.profile).toHaveProperty('username');
        expect(profile.body.profile.username).toBe('demo_user');
        expect(profile.body.profile).not.toHaveProperty('email');
        expect(profile.body.profile).not.toHaveProperty('birthdate');
    });
})

describe('INVALID GET /api/:username', () => {
    let login: LoginResponseDTO;

    beforeEach(async () => {
        await createUser({
            username: 'demo_user',
            email: 'demo@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
            isPublic: false,
        })

        login = await loginUser({
            email: 'demo@mail.com',
            password: '123456',
        })
    })

    it('Error 404 en usuario no encontrado', async () => {
        const profile = await request(app)
            .get('/api/demo_user_fake')
            .auth(login.token, { type: 'bearer' });

        expect(profile.statusCode).toBe(404);
        expect(profile.body.message).toBe('User not found');
    });
});