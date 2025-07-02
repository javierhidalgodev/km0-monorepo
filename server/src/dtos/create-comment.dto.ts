import { z } from 'zod';
import { createCommentSchema } from '@/schemas/comment.schema';

export type CreateCommentRequestDTO = z.infer<typeof createCommentSchema>;

export interface CreateCommentResponseDTO {
    status: 'created';
    comment: {
        id: string;
        user: string;
        post: string;
        content: string;
        createdAt: Date;
    };
};