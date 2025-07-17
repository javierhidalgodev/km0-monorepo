import mongoose from 'mongoose';
import request from 'supertest';
import app from '@/app';
import { createPost } from '@/services/post.service';
import { createUser, loginUser } from '@/services/user.service';
import { createComment } from '@/services/comment.service';
import { generateObjectId } from '@/helpers/generic.routes.helpers';

const MONGO_DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/km0-dev';
let token: string;
let token2: string;
let postIDPrivate: string;
let postIDPublic: string;

beforeAll(async () => {
    await mongoose.connect(MONGO_DB_URI);

    // First User (private) + Post + Comments
    await createUser({
        username: 'demo_user',
        email: 'demo@mail.com',
        birthdate: '1990-01-01',
        password: '123456',
        isPublic: false,
    })

    const loginResponse = await loginUser({
        email: 'demo@mail.com',
        password: '123456',
    });

    token = loginResponse.token;

    const createPostResponse = await createPost(loginResponse.user.id, {
        activity: 'run',
        mood: 'excellent',
        text: 'Private post',
    });

    postIDPrivate = createPostResponse.post.id;

    await createComment(loginResponse.user.id, postIDPrivate, {
        content: 'Salvaje bicho!',
    });
    await createComment(loginResponse.user.id, postIDPrivate, {
        content: 'Golzalo!',
    });

    // Second User (public) + post
    await createUser({
        username: 'demo_user_2',
        email: 'demo_2@mail.com',
        birthdate: '1990-01-01',
        password: '123456',
    })

    const loginResponse2 = await loginUser({
        email: 'demo_2@mail.com',
        password: '123456',
    });

    token2 = loginResponse2.token;

    const createPostResponse2 = await createPost(loginResponse2.user.id, {
        activity: 'walk',
        mood: 'excellent',
        text: 'Public post',
    });

    postIDPublic = createPostResponse2.post.id;
});

afterAll(async () => {
    await mongoose.connection.dropCollection('users');
    await mongoose.connection.dropCollection('posts');
    await mongoose.connection.dropCollection('comments');
    await mongoose.connection.close();
});

describe('SUCCESS: GET /api/posts/:postID => POST + COMENTARIOS', () => {
    it('Post PRIVADO recuperado exitosamente por el usuario creador + comentarios', async () => {
        const response = await request(app)
            .get(`/api/posts/${postIDPrivate}`)
            .auth(token, { type: 'bearer' });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('comments');
        expect(response.body.comments).toHaveLength(2);
    });

    it('Post PÚBLICO recuperado exitosamente por usuario NO LOGGEADO + comentarios', async () => {
        const response = await request(app)
            .get(`/api/posts/${postIDPublic}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('comments');
        expect(response.body.comments).toHaveLength(0);
    });

    it('Post PÚBLICO recuperado exitosamente por usuario LOGGEADO y NO CREADOR + comentarios', async () => {
        const response = await request(app)
            .get(`/api/posts/${postIDPublic}`)
            .auth(token, { type: 'bearer' });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('comments');
        expect(response.body.comments).toHaveLength(0);
    });
});

describe('ERROR: GET /api/posts/:postID => POST + COMENTARIOS', () => {
    it('Post PRIVADO no se puede recuperar por usuario NO LOGEADO', async () => {
        const response = await request(app)
            .get(`/api/posts/${postIDPrivate}`)

        expect(response.statusCode).toBe(403);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Unauthorized');
    });

    it('Post PRIVADO no se puede recuperar por usuario LOGEADO y NO CREADOR', async () => {
        const response = await request(app)
            .get(`/api/posts/${postIDPrivate}`)
            .auth(token2, { type: 'bearer' });

        expect(response.statusCode).toBe(403);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Unauthorized');
    });

    it('ObjectID del post incorrecto', async () => {
        const response = await request(app)
            .get(`/api/posts/123`)
            .auth(token, { type: 'bearer' });

        expect(response.statusCode).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Invalid ObjectID');
    });

    it('El post que se intenta recuperar no existe', async () => {
        const response = await request(app)
            .get(`/api/posts/${generateObjectId()}`)
            .auth(token, { type: 'bearer' });

        expect(response.statusCode).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Post not found');
    });
});