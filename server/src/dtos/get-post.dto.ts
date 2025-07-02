import { TActivity, TMood } from '@/models/post.model';

export interface PostResponseDTO {
    id: string;
    user: {
        id: string;
        username: string;
    };
    text?: string;
    activity: TActivity;
    mood: TMood;
    createdAt: Date;
};

export type GetPostsResponseDTO = {
    status: 'ok',
    posts: PostResponseDTO[],
};