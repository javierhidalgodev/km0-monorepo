import mongoose from 'mongoose';
import request from 'supertest';
import app from '@/app';
import { loginUser } from '@/services/user.service';
import { createComment } from '@/helpers/comment.routes.helpers';
import { generateObjectId } from '@/helpers/generic.routes.helpers';

const MONGO_DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/km0-dev';
let token1: string;
let token2: string;
let privatePostID: string;
let publicPostID: string;
let commentID: string;

beforeAll(async () => {
    await mongoose.connect(MONGO_DB_URI);

    await request(app)
        .post('/api/users')
        .send({
            username: 'demo_user',
            email: 'demo@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
            isPublic: false,
        });

    await request(app)
        .post('/api/users')
        .send({
            username: 'demo_user_2',
            email: 'demo_2@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
        });

    const loginResponse1 = await request(app)
        .post('/api/login')
        .send({
            email: 'demo@mail.com',
            password: '123456',
        });

    token1 = loginResponse1.body.token;

    const loginResponse2 = await request(app)
        .post('/api/login')
        .send({
            email: 'demo_2@mail.com',
            password: '123456',
        });

    token2 = loginResponse2.body.token;

    const createPrivatePostResponse = await request(app)
        .post('/api/posts')
        .send({
            activity: 'run',
            mood: 'bad',
            text: 'demo test',
        })
        .auth(token1, { type: 'bearer' });

    privatePostID = createPrivatePostResponse.body.post.id;

    const createPublicPostResponse = await request(app)
        .post('/api/posts')
        .send({
            activity: 'run',
            mood: 'bad',
            text: 'demo test',
        })
        .auth(token2, { type: 'bearer' });

    publicPostID = createPublicPostResponse.body.post.id;
});

afterAll(async () => {
    await mongoose.connection.dropCollection('users');
    await mongoose.connection.dropCollection('posts');
    await mongoose.connection.dropCollection('comments');
    await mongoose.connection.close()
});

beforeEach(async () => {
    await mongoose.connection.dropCollection('comments');
});

describe('VALID POST /api/posts/:postID/comments', () => {
    it('POST PÚBLICO --> Cualquier usuario loggeado puede comentar', async () => {
        const resultWithToken1 = await request(app)
            .post(`/api/posts/${publicPostID}/comments`)
            .send({
                content: 'Menuda carrera papá!',
            })
            .auth(token1, { type: 'bearer' });

        const resultWithToken2 = await request(app)
            .post(`/api/posts/${publicPostID}/comments`)
            .send({
                content: 'Menuda carrera papá!',
            })
            .auth(token2, { type: 'bearer' });

        expect(resultWithToken1.statusCode).toBe(201);
        expect(resultWithToken1.body.status).toBe('created');
        expect(resultWithToken1.body.comment.post).toBe(publicPostID);
        expect(resultWithToken1.body.comment.content).toBe('Menuda carrera papá!');

        expect(resultWithToken2.statusCode).toBe(201);
        expect(resultWithToken2.body.status).toBe('created');
        expect(resultWithToken2.body.comment.post).toBe(publicPostID);
        expect(resultWithToken2.body.comment.content).toBe('Menuda carrera papá!');
    });

    it('POST PRIVADO --> El propietario loggeado puede comentar', async () => {
        const result = await request(app)
            .post(`/api/posts/${privatePostID}/comments`)
            .send({
                content: 'Menuda carrera papá!',
            })
            .auth(token1, { type: 'bearer' });

        expect(result.statusCode).toBe(201);
        expect(result.body.status).toBe('created');
        expect(result.body.comment.post).toBe(privatePostID);
        expect(result.body.comment.content).toBe('Menuda carrera papá!');
    });
});

describe('INVALID POST /api/posts/:postID/comments', () => {
    it('Un post PÚBLICO/PRIVADO no puede ser comentado por un usuario no loggeado', async () => {
        const resultWithToken1 = await request(app)
            .post(`/api/posts/${publicPostID}/comments`)
            .send({
                content: 'Menuda carrera papá!',
            });

        const resultWithToken2 = await request(app)
            .post(`/api/posts/${privatePostID}/comments`)
            .send({
                content: 'Menuda carrera papá!',
            });

        expect(resultWithToken1.statusCode).toBe(401);
        expect(resultWithToken1.body.status).toBe('error');
        expect(resultWithToken1.body.message).toBe('Invalid token');
        expect(resultWithToken2.statusCode).toBe(401);
        expect(resultWithToken2.body.status).toBe('error');
        expect(resultWithToken2.body.message).toBe('Invalid token');
    });

    it('Un POST PRIVADO no puede ser comentado por usuario distinto del creador', async () => {
        const result = await request(app)
            .post(`/api/posts/${privatePostID}/comments`)
            .send({
                content: 'Menuda carrera papá!',
            })
            .auth(token2, { type: 'bearer' });

        expect(result.statusCode).toBe(403);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Forbidden');
    });

    it('Error de validación de campo no aceptado, 400 + \'Error de validación\'', async () => {
        const result = await request(app)
            .post(`/api/posts/${privatePostID}/comments`)
            .send({
                contet: 'Menuda carrera papá!',
            })
            .auth(token1, { type: 'bearer' });

        expect(result.statusCode).toBe(400);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Error de validación');
        expect(result.body.details._errors[0]).toContain('Unrecognized key(s) in object: \'contet\'');
    });

    it('Error de mínimo de caracteres para campos con espacios en blanco, 400 + \'Error de validación\'', async () => {
        const result = await request(app)
            .post(`/api/posts/${publicPostID}/comments`)
            .send({
                content: '',
            })
            .auth(token1, { type: 'bearer' });

        expect(result.statusCode).toBe(400);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Error de validación');
        expect(result.body.details.content._errors[0]).toContain('El comentario no puede estar vacío');
    });

    it('Error de máximo de caracteres superado, 400 + \'Error de validación\'', async () => {
        const result = await request(app)
            .post(`/api/posts/${privatePostID}/comments`)
            .send({
                content: 'Esta herramienta online se utiliza para contar caracteres de un texto y cantidad de palabras, calcula también la densidad de palabras claves quitando las stop words. Esta herramienta online se utiliza para contar caracteres de un texto y cantidad de palabras, calcula también la densidad de palabras. +',
            })
            .auth(token1, { type: 'bearer' });

        expect(result.statusCode).toBe(400);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Error de validación');
        expect(result.body.details.content._errors[0]).toContain('El comentario no puede contener más de 300 caracteres');
    });
});

describe('VALID GET /api/posts/:postID/comments', () => {
    it('Se recuperan exitósamente los comentarios', async () => {
        await createComment(token1, privatePostID);

        const response = await request(app)
            .get(`/api/posts/${privatePostID}/comments`)
            .auth(token1, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.comments).toHaveLength(1);
    });
});

describe('INVALID GET /api/posts/:postID/comments', () => {
    it('Si el post no existe => 404 + \'Post not found\'', async () => {
        const fakeObjectID = generateObjectId();

        const response = await request(app)
            .get(`/api/posts/${fakeObjectID}/comments`)
            .auth(token1, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Post not found');
    });

    it('ID de post inválido => 400 + \'Identificador de post inválido\'', async () => {
        const response = await request(app)
            .get(`/api/posts/123/comments`)
            .auth(token1, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Invalid ObjectID');
    });
});

describe('VALID DELETE /api/comments/:commentID', () => {
    it('Comentario borrado existosamente', async () => {
        const comment = await createComment(token1, privatePostID);
        commentID = comment.body.comment.id

        const response = await request(app)
            .delete(`/api/comments/${commentID}`)
            .auth(token1, { type: 'bearer' });

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('deleted');
        expect(response.body.message).toBe('Comment deleted successfully');
    });
});

describe('INVALID DELETE /api/comments/:commentID', () => {
    it('No encuentra el comentario que se quiere borrar', async () => {
        const response = await request(app)
            .delete(`/api/comments/${generateObjectId()}`)
            .auth(token1, { type: 'bearer' });

        expect(response.statusCode).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Comment not found');
    });

    it('El usuario que intenta borrar no es el que creó', async () => {
        const comment = await createComment(token1, privatePostID);
        commentID = comment.body.comment.id

        const { token: secondUserToken } = await loginUser({
            email: 'demo_2@mail.com',
            password: '123456',
        });

        const response = await request(app)
            .delete(`/api/comments/${commentID}`)
            .auth(secondUserToken, { type: 'bearer' });


        expect(response.statusCode).toBe(403);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Unauthorized');
    });
});