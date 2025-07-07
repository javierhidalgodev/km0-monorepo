import request from 'supertest';
import app from '@/app';

export const createComment = async (token: string, postID: string) => {
    return await request(app)
        .post(`/api/posts/${postID}/comments`)
        .send({
            content: 'Menuda carrera papá!',
        })
        .auth(token, { type: 'bearer' });
}