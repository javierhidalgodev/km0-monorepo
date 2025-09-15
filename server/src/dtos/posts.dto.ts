import { z } from 'zod';
import { createPostSchema } from '@/schemas/post.schema';
import { TActivity, TMood } from '@/models/post.model';
import { MappedComment } from '@/dtos/comments.dto';

export type CreatePostRequestDTO = z.infer<typeof createPostSchema>;

export interface CreatePostResponseDTO {
    status: 'created';
    post: {
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
};

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

export interface GetPostDetailResponseDTO extends PostResponseDTO {
    comments: MappedComment[];
};

export interface DeletePostResponseDTO {
    status: 'deleted',
    message: 'Post deleted successfully',
};