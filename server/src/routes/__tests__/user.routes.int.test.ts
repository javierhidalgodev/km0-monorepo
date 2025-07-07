import request from 'supertest';
import mongoose from 'mongoose';
import { IUser, UserModel } from '../../models/user.model';
import app from '../../app';
import { createUser } from '../../services/user.service';
import { generateToken } from '../../utils/auth';

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
        }) ;

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
    beforeEach(async() => {
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

describe('POST /api/profile', () => {
    beforeEach(async() => {
        await createUser({
            username: 'demo_user',
            email: 'demo@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
        })
    })

    it('Con un token correcto, se obtiene el perfil', async () => {
        const result = await request(app)
            .post('/api/login')
            .send({
                email: 'demo@mail.com',
                password: '123456',
            });

        const profile = await request(app)
            .get('/api/profile')
            .auth(result.body.token, { type: 'bearer' });

        expect(profile.statusCode).toBe(200);
        expect(profile.body.status).toBe('ok');
        expect(profile.body.profile.email).toBe('demo@mail.com');
    });

    it('Sin token devuelve AppError', async () => {
        const profile = await request(app)
            .get('/api/profile');

        expect(profile.statusCode).toBe(401);
        expect(profile.body.message).toBe('Invalid token');
    });

    it('Token inválido o caducado devuelve AppError', async () => {
        const profile = await request(app)
            .get('/api/profile')
            .auth('123asd', { type: 'bearer' });

        expect(profile.statusCode).toBe(401);
        expect(profile.body.message).toBe('Token inválido o caducado');
    });

    it('Token válido, pero usuario inexistente', async () => {
        const token = generateToken({
            _id: '63ff68f7b3c5a84f68abc01',
            email: 'ghost@mail.com',
            username: 'ghost',
            password: 'ghost_pass',
            birthdate: '2020-02-02',
        } as IUser)

        const profile = await request(app)
            .get('/api/profile')
            .auth(token, { type: 'bearer' });

        expect(profile.statusCode).toBe(404);
        expect(profile.body.message).toBe('Usuario no encontrado');
    });
})