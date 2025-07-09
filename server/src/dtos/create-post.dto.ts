import { z } from 'zod';
import { createPostSchema } from '@/schemas/post.schema';
import { TActivity, TMood } from '@/models/post.model';

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
        isPublic: boolean;
        createdAt: Date;
    };
};