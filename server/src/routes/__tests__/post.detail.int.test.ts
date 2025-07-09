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
let postID: string;

beforeAll(async () => {
    await mongoose.connect(MONGO_DB_URI);

    await createUser({
        username: 'demo_user',
        email: 'demo@mail.com',
        birthdate: '1990-01-01',
        password: '123456',
    })

    await createUser({
        username: 'demo_user_2',
        email: 'demo_2@mail.com',
        birthdate: '1990-01-01',
        password: '123456',
    })

    const loginResponse = await loginUser({
        email: 'demo@mail.com',
        password: '123456',
    });

    token = loginResponse.token;

    const loginResponse2 = await loginUser({
        email: 'demo_2@mail.com',
        password: '123456',
    });

    token2 = loginResponse2.token;

    const createPostResponse = await createPost(loginResponse.user.id, {
        activity: 'run',
        mood: 'excellent',
        text: 'Menuda carrera papá!',
    });

    postID = createPostResponse.post.id;

    await createComment(loginResponse.user.id, postID, {
        content: 'Salvaje bicho!',
    });
    await createComment(loginResponse.user.id, postID, {
        content: 'Golzalo!',
    });
});

afterAll(async () => {
    await mongoose.connection.dropCollection('users');
    await mongoose.connection.dropCollection('posts');
    await mongoose.connection.dropCollection('comments');
    await mongoose.connection.close();
});

describe('GET /api/posts/:postID => POST + COMENTARIOS', () => {
    it('Se recupera exitosamente el post + comentarios', async () => {
        const response = await request(app)
            .get(`/api/posts/${postID}`)
            .auth(token, { type: 'bearer' });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('comments');
        expect(response.body.comments).toHaveLength(2);
    });

    it('Un usuario distinto al que creó el post también recupera exitosamente el post + comentarios', async () => {
        const response = await request(app)
            .get(`/api/posts/${postID}`)
            .auth(token2, { type: 'bearer' });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('comments');
        expect(response.body.comments).toHaveLength(2);
    });
});

describe('INVALID /api/posts/:postID => POST + COMENTARIOS', () => {
    it('Sin login no se recupera el post', async () => {
        const response = await request(app)
            .get(`/api/posts/${postID}`)

        expect(response.statusCode).toBe(401);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Invalid token');
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