import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app';
import { createPost, createPosts, createVariousPosts, PostDataToTest } from './helpers/post.routes.helpers';
import { loginUser } from '@/services/user.service';
import { generateObjectId } from './helpers/comment.routes.helpers';

const MONGO_DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/km0-dev';
let token: string;

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

    await request(app)
        .post('/api/users')
        .send({
            username: 'demo_user_2',
            email: 'demo_2@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
        });

    const response = await request(app)
        .post('/api/login')
        .send({
            email: 'demo@mail.com',
            password: '123456',
        });

    token = response.body.token;
});

afterAll(async () => {
    await mongoose.connection.dropCollection('users');
    await mongoose.connection.dropCollection('posts');
    await mongoose.connection.close();
});

beforeEach(async () => {
    await mongoose.connection.dropCollection('posts');;
});

describe('POST /api/posts', () => {
    it('Creación de post exitosa', async () => {
        const result = await request(app)
            .post('/api/posts')
            .send({
                activity: 'run',
                mood: 'bad',
                text: 'demo test',
            })
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(201);
        expect(result.body.status).toBe('created');
        expect(result.body.post.activity).toBe('run');
        expect(result.body.post.mood).toBe('bad');
    });

    it('Error por que faltan datos requeridos', async () => {
        const result = await request(app)
            .post('/api/posts')
            .send({
                mood: 'bad',
            })
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(400);
        expect(result.body.status).toBe('error');
    });

    it('Error por datos inválidos', async () => {
        const result = await request(app)
            .post('/api/posts')
            .send({
                activity: 'good',
                mood: 'bad',
            })
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(400);
        expect(result.body.status).toBe('error');
        expect(result.body.details.activity._errors[0]).toContain(`Invalid enum value`);
    });

    it('Error por text demasiado largo', async () => {
        const result = await request(app)
            .post('/api/posts')
            .send({
                activity: 'run',
                mood: 'bad',
                text: 'Esta herramienta online se utiliza para contar caracteres de un texto y cantidad de palabras, calcula también la densidad de palabras claves quitando las stop words. Esta herramienta online se utiliza para contar caracteres de un texto y cantidad de palabras, calcula también la densidad de palabras. +'
            })
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(400);
        expect(result.body.status).toBe('error');
        expect(result.body.details.text._errors[0]).toContain(`El campo no puede exceder de 300 caracteres`);
    });

    it('Error por token ausente', async () => {
        const result = await request(app)
            .post('/api/posts')
            .send({
                activity: 'run',
                mood: 'bad',
            })

        expect(result.statusCode).toBe(401);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Invalid token');
    });

    it('Error por token inválido', async () => {
        const result = await request(app)
            .post('/api/posts')
            .send({
                activity: 'good',
                mood: 'bad',
            })
            .auth('asd', { type: 'bearer' });

        expect(result.statusCode).toBe(401);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Token inválido o caducado');
    });
});

describe('VALID GET /api/posts', () => {
    it('Se recuperan correctamente todos los posts sin filtros', async () => {
        await createVariousPosts(token);

        const result = await request(app)
            .get('/api/posts')
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(200);
        expect(result.body.status).toBe('ok');
        expect(result.body.posts.length).toBe(3);
        expect(result.body.posts[0]).toHaveProperty('activity', 'run');
    });

    it('Se filtran bien, pero no hay coincidencias \'activity: other\'', async () => {
        await createPosts(token, [
            { activity: 'run', mood: 'bad', text: 'Demo_1' },
            { activity: 'walk', mood: 'excellent', text: 'Demo_2' },
        ]);

        const result = await request(app)
            .get('/api/posts?activity=other')
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(200);
        expect(result.body.status).toBe('ok');
        expect(result.body.posts).toEqual([]);
    });

    it('Se recuperan correctamente todos los posts con filtro \'activity: run\'', async () => {
        await createPosts(token, [
            { activity: 'run', mood: 'bad', text: 'Demo_1' },
            { activity: 'walk', mood: 'excellent', text: 'Demo_2' },
            { activity: 'other', mood: 'regular', text: 'Demo_3' },
            { activity: 'run', mood: 'regular', text: 'Demo_4' },
            { activity: 'run', mood: 'bad', text: 'Demo_5' },
            { activity: 'walk', mood: 'good', text: 'Demo_6' },
            { activity: 'run', mood: 'bad' },
        ]);

        const result = await request(app)
            .get('/api/posts?activity=run')
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(200);
        expect(result.body.status).toBe('ok');
        expect(result.body.posts.length).toBe(4);
        expect(result.body.posts.map((p: PostDataToTest) => p.mood)).toEqual(
            expect.arrayContaining(['bad', 'regular', 'bad', 'bad'])
        );
        expect(result.body.posts[3]).toHaveProperty('text', 'Demo_1');
    });

    it('Se recuperan correctamente todos los posts con filtro \'mood: bad\'', async () => {
        await createPosts(token, [
            { activity: 'other', mood: 'bad', text: 'Demo_1' },
            { activity: 'walk', mood: 'excellent', text: 'Demo_2' },
            { activity: 'run', mood: 'bad', text: 'Demo_3' },
            { activity: 'other', mood: 'regular' },
        ]);

        const result = await request(app)
            .get('/api/posts?mood=bad')
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(200);
        expect(result.body.status).toBe('ok');
        expect(result.body.posts.length).toBe(2);
        expect(result.body.posts[0]).toHaveProperty('activity', 'run');
        expect(result.body.posts[1]).toHaveProperty('mood', 'bad');
    });

    it('Se recuperan correctamente todos los posts con filtro combinado \'activity: run\' + \'mood: bad\'', async () => {
        await createPosts(token, [
            { activity: 'other', mood: 'bad', text: 'Demo_1' },
            { activity: 'walk', mood: 'excellent', text: 'Demo_2' },
            { activity: 'run', mood: 'bad', text: 'Demo_3' },
            { activity: 'other', mood: 'good', text: 'Demo_4' },
            { activity: 'run', mood: 'bad' },
        ]);

        const result = await request(app)
            .get('/api/posts?activity=run&mood=bad')
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(200);
        expect(result.body.status).toBe('ok');
        expect(result.body.posts.length).toBe(2);
        expect(result.body.posts[0]).not.toHaveProperty('text');
        expect(result.body.posts[1]).toHaveProperty('text', 'Demo_3');
    });
});

describe('INVALID GET /api/posts', () => {
    it('Filtro con valor erróneo devuelve 400 +  \'Error de validación\'; ex: \'mood: bd\'', async () => {
        await createPosts(token, [
            { activity: 'other', mood: 'bad', text: 'Demo_1' },
            { activity: 'walk', mood: 'excellent', text: 'Demo_2' },
            { activity: 'run', mood: 'bad', text: 'Demo_3' },
            { activity: 'other', mood: 'good', text: 'Demo_4' },
            { activity: 'run', mood: 'bad' },
        ]);

        const result = await request(app)
            .get('/api/posts?mood=bd')
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(400);
        expect(result.body.message).toBe('Error de validación');
        expect(result.body.details).toHaveProperty('mood');
    });

    it('Filtro con propiedad errónea devuelve 400 +  \'Error de validación\'; ex: \'mod: bad\'', async () => {
        await createPosts(token, [
            { activity: 'other', mood: 'bad', text: 'Demo_1' },
            { activity: 'walk', mood: 'excellent', text: 'Demo_2' },
            { activity: 'run', mood: 'bad', text: 'Demo_3' },
            { activity: 'other', mood: 'good', text: 'Demo_4' },
            { activity: 'run', mood: 'bad' },
        ]);

        const result = await request(app)
            .get('/api/posts?mod=bad')
            .auth(token, { type: 'bearer' });

        // console.log(result.body.details);

        expect(result.statusCode).toBe(400);
        expect(result.body.message).toBe('Error de validación');
        expect(result.body.details._errors).toContain('Unrecognized key(s) in object: \'mod\'');
    });

    it('Sin token: 401 + \'Invalid token\'', async () => {
        const result = await request(app)
            .get('/api/posts');

        expect(result.statusCode).toBe(401);
        expect(result.body.message).toBe('Invalid token');
    });

    it('Token inválido o caducado: 401 + \'Token inválido o caducado\'', async () => {
        const result = await request(app)
            .get('/api/posts')
            .auth('asd', { type: 'bearer' });

        expect(result.statusCode).toBe(401);
        expect(result.body.message).toBe('Token inválido o caducado');
    });
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
});

describe('DELETE /api/posts/:postID', () => {
    it('Post borrado existosamente', async () => {
        const { post } = await createPost(token);

        const result = await request(app)
            .delete(`/api/posts/${post.id}`)
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(200);
        expect(result.body.status).toBe('deleted');
        expect(result.body.message).toBe('Post deleted successfully');
    });

    it('Post no encontrado', async () => {
        const result = await request(app)
            .delete(`/api/posts/${generateObjectId()}`)
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(404);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Post not found');
    });

    it('El usuario que intenta borrar, no es el que creó el post', async () => {
        const { post } = await createPost(token);

        const { token: secondUserToken } = await loginUser({
            email: 'demo_2@mail.com',
            password: '123456',
        });

        const result = await request(app)
            .delete(`/api/posts/${post.id}`)
            .auth(secondUserToken, { type: 'bearer' });

        expect(result.statusCode).toBe(403);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Unauthorized');
    });

    it('ObjectID inválido', async () => {
        const result = await request(app)
            .delete(`/api/posts/123`)
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(400);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Invalid ObjectID');
    });
});