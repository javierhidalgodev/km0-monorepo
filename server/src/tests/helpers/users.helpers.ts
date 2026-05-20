import app from '@/app';
import request from 'supertest';

// Parametrizar el test para evitar hardcodear

export const createTestUsers = async (dataset: {
    username: string,
    email: string,
    birthdate: string,
    password: string,
    isPublic?: boolean | true,
}[]): (Promise<{
    email: string,
    password: string,
}[]>) => {
    let createdUsersLogin: {
        email: string,
        password: string
    }[] = [];

    for (const d of dataset) {
        await request(app)
            .post('/api/users')
            .send(d);

        createdUsersLogin.push({
            email: d.email,
            password: d.password,
        });
    }

    return createdUsersLogin;
}

export const loginUsers = async (dataset: {
    email: string,
    password: string,
}[]): (Promise<string[]>) => {
    let tokens: string[] = [];

    for (const l of dataset) {
        const response = await request(app)
            .post('/api/login')
            .send(l);

        tokens.push(response.body.token);
    };

    return tokens;
};