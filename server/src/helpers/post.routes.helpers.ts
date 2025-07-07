import request from 'supertest';
import app from '@/app';
import { TActivity, TMood } from '@/models/post.model';
import { CreatePostResponseDTO } from '@/dtos/create-post.dto';

export const createPost = async (token: string):  Promise<CreatePostResponseDTO> => {
    const result = await request(app)
        .post('/api/posts')
        .send({
            activity: 'run',
            mood: 'bad',
            text: 'demo test',
        })
        .auth(token, { type: 'bearer' });

    return result.body;
}

export type PostDataToTest = {
    activity: TActivity,
    mood: TMood,
    text?: string,
}

export const createPosts = async (token: string, postsData: PostDataToTest[]) => {
    for(const post of postsData) {
        await request(app)
            .post('/api/posts')
            .send(post)
            .auth(token, { type: 'bearer' });
    }
}

export const createVariousPosts = async (token: string, count = 3) => {
    const post = [];

    for(let i = 0; i < count; i++) {
        const res = await createPost(token);
        post.push(res);
    }

    return post;
}