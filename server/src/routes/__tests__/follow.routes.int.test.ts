import app from '@/app';
import { generateObjectId } from '@/helpers/generic.routes.helpers';
import { UserModel } from '@/models/user.model';
import mongoose from 'mongoose';
import request from 'supertest';

const MONGO_DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/km0-dev';
let token: string;
let userID: string;
let username: string;

let token2: string;
let userID2: string;
let username2: string;

let token3: string;
let userID3: string;
let username3: string;

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

    await request(app)
        .post('/api/users')
        .send({
            username: 'demo_user_3',
            email: 'demo_user_3@mail.com',
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
    userID = login.body.user.id;
    username = login.body.user.username;

    const login2 = await request(app)
        .post('/api/login')
        .send({
            email: 'demo_user_2@mail.com',
            password: '123456',
        });

    token2 = login2.body.token;
    userID2 = login2.body.user.id;
    username2 = login2.body.user.username;

    const login3 = await request(app)
        .post('/api/login')
        .send({
            email: 'demo_user_3@mail.com',
            password: '123456',
        });

    token3 = login3.body.token;
    userID3 = login3.body.user.id;
    username3 = login3.body.user.username;
});

afterAll(async () => {
    await mongoose.connection.dropCollection('users');
    await mongoose.connection.close();
});

beforeEach(async () => {
    await UserModel.updateMany({}, { $set: { followers: [], followRequests: [], following: [] } });
})

describe('VALID POST /api/follow/:username', () => {
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

    it('Cuando se sigue un perfil público, el perfil demandante y el demandado, reflejan los cambios', async () => {
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

    it('El usuario que se quiere seguir no existe', async () => {
        const response = await request(app)
            .post('/api/follow/demo_user_fake')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('User not found');
    });

    it('Ya se sigue al usuario público', async () => {
        await request(app)
            .post('/api/follow/demo_user_2')
            .auth(token, { type: 'bearer' });

        const response = await request(app)
            .post('/api/follow/demo_user_2')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Already following');
    });

    it('Ya existe una petición de seguimiento al usuario privado', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        const response = await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Follow request already pending');
    });
});

describe('VALID PATCH ACCEPT /api/follow/requests/:requestingUserID/accept', () => {
    it('Petición aceptada exitosamente por el usuario privado', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        const response = await request(app)
            .patch(`/api/follow/requests/${userID2}/accept`)
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('accepted');
        expect(response.body.message).toBe(`Follow request from ${username2} accepted`);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.username).toBe(username);
        expect(response.body.user.followRequests).not.toContain(userID2);
    });

    it('Actualización del usuario que solicita correcta', async () => {
        const profileBefore = await request(app)
            .get('/api/demo_user_2')
            .auth(token2, { type: 'bearer' });

        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        await request(app)
            .patch(`/api/follow/requests/${userID2}/accept`)
            .auth(token, { type: 'bearer' });

        const profileAfter = await request(app)
            .get('/api/demo_user_2')
            .auth(token2, { type: 'bearer' });

        expect(profileAfter.status).toBe(200);
        expect(profileAfter.body.status).toBe('ok');
        expect(profileAfter.body.profile.following - profileBefore.body.profile.following).toBe(1);
    });
});

describe('INVALID PATCH ACCEPT /api/follow/requests/:requestingUserID/accept', () => {
    it('ObjectID erróneo', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        const response = await request(app)
            .patch('/api/follow/requests/asd/accept')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Invalid ObjectID');
    });

    it('No se puede aceptar una petición de usuario no existe', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        const response = await request(app)
            .patch(`/api/follow/requests/${generateObjectId()}/accept`)
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('User not found');
    });

    it('No se puede aceptar una petición de usuario que ya es seguidor', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        await request(app)
            .patch(`/api/follow/requests/${userID2}/accept`)
            .auth(token, { type: 'bearer' });

        const response = await request(app)
            .patch(`/api/follow/requests/${userID2}/accept`)
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('This user already follows you');
    });

    it('No se puede aceptar una petición de usuario que no hizo petición', async () => {
        const response = await request(app)
            .patch(`/api/follow/requests/${userID3}/accept`)
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('This user does not requested to follow you');
    });
});

describe('VALID PATCH REJECT /api/follow/requests/:requestingUserID/reject', () => {
    it('Petición rechazada exitosamente por el usuario privado', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        const response = await request(app)
            .patch(`/api/follow/requests/${userID2}/reject`)
            .auth(token, { type: 'bearer' });

        const user = await request(app)
            .get('/api/demo_user')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('rejected');
        expect(response.body.message).toBe(`Follow request from ${username2} rejected`);
        expect(response.body).not.toHaveProperty('user');
        expect(user.body.profile.followRequests).toHaveLength(0);
    });

    it('Un usuario rechazado puede volver a pedir seguimiento, y obtener el primer mensaje', async () => {
        // Seguir
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        // Rechazar
        await request(app)
            .patch(`/api/follow/requests/${userID2}/reject`)
            .auth(token, { type: 'bearer' });

        // Volver a seguir
        const response = await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('pending');
        expect(response.body.message).toBe('Wait for user response');
    });
});

describe('INVALID PATCH REJECT /api/follow/requests/:requestingUserID/reject', () => {
    it('Sin token no se puede hacer la petición', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        const response = await request(app)
            .patch(`/api/follow/requests/${userID2}/reject`);

        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Invalid token');
    });

    it('No se puede rechazar una petición de usuario no existe', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        const response = await request(app)
            .patch(`/api/follow/requests/${generateObjectId()}/reject`)
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('User not found');
    });

    it('No se puede rechazar una petición de usuario que ya es seguidor', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        await request(app)
            .patch(`/api/follow/requests/${userID2}/accept`)
            .auth(token, { type: 'bearer' });

        const response = await request(app)
            .patch(`/api/follow/requests/${userID2}/reject`)
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('This user already follows you');
    });

    it('No se puede rechazar una petición de usuario que no hizo petición', async () => {
        const response = await request(app)
            .patch(`/api/follow/requests/${userID3}/reject`)
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('This user does not requested to follow you');
    });
});

describe('GET follow requests', () => {
    it('Petición exitosa', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        const response = await request(app)
            .get('/api/follow/follow-requests')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body).toHaveProperty('followRequests');
        expect(response.body.followRequests).toHaveLength(1);
        expect(response.body.followRequests).toEqual(
            expect.arrayContaining([
                expect.objectContaining(
                    {
                        _id: userID2,
                        username: 'demo_user_2',
                        isPublic: true
                    }
                )
            ]),
        );
    });

    it('Recuperación correcta del array de followRequests tras aceptar una petición', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        await request(app)
            .patch(`/api/follow/requests/${userID2}/accept`)
            .auth(token, { type: 'bearer' });

        const response = await request(app)
            .get('/api/follow/follow-requests')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body).toHaveProperty('followRequests');
        expect(response.body.followRequests).toHaveLength(0);
    });

    it('Petición sin token inválida', async () => {
        const response = await request(app)
            .get('/api/follow/follow-requests');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid token');
    });
});

describe('DELETE unfollow request', () => {
    it('Se deja de seguir al usuario exitosamente', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        await request(app)
            .patch(`/api/follow/requests/${userID2}/accept`)
            .auth(token, { type: 'bearer' });

        const response = await request(app)
            .delete(`/api/follow/${username}`)
            .auth(token2, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('unfollowed');
        expect(response.body.message).toBe(`You no longer follow ${username}`);
    });

    it('Sin token la petición no es exitosa', async () => {
        await request(app)
            .post('/api/follow/demo_user')
            .auth(token2, { type: 'bearer' });

        await request(app)
            .patch(`/api/follow/requests/${userID2}/accept`)
            .auth(token, { type: 'bearer' });

        const response = await request(app)
            .delete(`/api/follow/${username}`);

        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Invalid token');
    });

    it('Intentar dejar de seguir a un usuario que no se seguía', async () => {
        const response = await request(app)
            .delete(`/api/follow/${username}`)
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('You are not following this user');
    });

    it('Intentar dejar de seguir a un usuario que no existe', async () => {
        const response = await request(app)
            .delete('/api/follow/fakeUser')
            .auth(token, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('User not found');
    });
});