import mongoose from 'mongoose';
import request from 'supertest';
import app from '@/app';
import { loginUser } from '@/services/user.service';
import { createComment } from '@/helpers/comment.routes.helpers';
import { generateObjectId } from '@/helpers/generic.routes.helpers';

const MONGO_DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/km0-dev';
let token: string;
let postID: string;
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
        });

    await request(app)
        .post('/api/users')
        .send({
            username: 'demo_user_2',
            email: 'demo_2@mail.com',
            birthdate: '1990-01-01',
            password: '123456',
        });

    const loginResponse = await request(app)
        .post('/api/login')
        .send({
            email: 'demo@mail.com',
            password: '123456',
        });

    token = loginResponse.body.token;

    const createPostResponse = await request(app)
        .post('/api/posts')
        .send({
            activity: 'run',
            mood: 'bad',
            text: 'demo test',
        })
        .auth(token, { type: 'bearer' });

    postID = createPostResponse.body.post.id;
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

describe('POST /api/posts/:postID/comments', () => {
    it('Creación de comentario existosa', async () => {
        const result = await request(app)
            .post(`/api/posts/${postID}/comments`)
            .send({
                content: 'Menuda carrera papá!',
            })
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(201);
        expect(result.body.status).toBe('created');
        expect(result.body.comment.post).toBe(postID);
        expect(result.body.comment.content).toBe('Menuda carrera papá!');
    });

    it('Error de validación de campo no aceptado, 400 + \'Error de validación\'', async () => {
        const result = await request(app)
            .post(`/api/posts/${postID}/comments`)
            .send({
                contet: 'Menuda carrera papá!',
            })
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(400);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Error de validación');
        expect(result.body.details._errors[0]).toContain('Unrecognized key(s) in object: \'contet\'');
    });

    // Válido también para caracteres en blanco '                '
    it('Error de mínimo de caracteres, 400 + \'Error de validación\'', async () => {
        const result = await request(app)
            .post(`/api/posts/${postID}/comments`)
            .send({
                content: '',
            })
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(400);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Error de validación');
        expect(result.body.details.content._errors[0]).toContain('El comentario no puede estar vacío');
    });

    it('Error de máximo de caracteres, 400 + \'Error de validación\'', async () => {
        const result = await request(app)
            .post(`/api/posts/${postID}/comments`)
            .send({
                content: 'Esta herramienta online se utiliza para contar caracteres de un texto y cantidad de palabras, calcula también la densidad de palabras claves quitando las stop words. Esta herramienta online se utiliza para contar caracteres de un texto y cantidad de palabras, calcula también la densidad de palabras. +',
            })
            .auth(token, { type: 'bearer' });

        expect(result.statusCode).toBe(400);
        expect(result.body.status).toBe('error');
        expect(result.body.message).toBe('Error de validación');
        expect(result.body.details.content._errors[0]).toContain('El comentario no puede contener más de 300 caracteres');
    });
});

describe('GET /api/posts/:postID/comments', () => {
    it('Se recuperan exitósamente los comentarios', async () => {
        await createComment(token, postID);

        const response = await request(app)
            .get(`/api/posts/${postID}/comments`)
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.comments).toHaveLength(1);
    });

    it('Si el post no existe => 404 + \'Post not found\'', async () => {
        const fakeObjectID = generateObjectId();

        const response = await request(app)
            .get(`/api/posts/${fakeObjectID}/comments`)
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Post not found');
    });

    it('ID de post inválido => 400 + \'Identificador de post inválido\'', async () => {
        const response = await request(app)
            .get(`/api/posts/123/comments`)
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Invalid ObjectID');
    });
});

describe('DELETE /api/comments/:commentID', () => {
    it('Comentario borrado existosamente', async () => {
        const comment = await createComment(token, postID);
        commentID = comment.body.comment.id

        const response = await request(app)
            .delete(`/api/comments/${commentID}`)
            .auth(token, { type: 'bearer' });

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('deleted');
        expect(response.body.message).toBe('Comment deleted succesfully');
    });

    it('No encuentra el comentario que se quiere borrar', async () => {
        const response = await request(app)
            .delete(`/api/comments/${generateObjectId()}`)
            .auth(token, { type: 'bearer' });

        expect(response.statusCode).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Comment not found');
    });

    it('El usuario que intenta borrar no es el que creó', async () => {
        const comment = await createComment(token, postID);
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