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

export interface DeleteCommentResponseDTO {
    status: 'deleted',
    message: 'Comment deleted successfully',
};

export interface MappedComment {
    id: string;
    user: {
        id: string;
        username: string;
    };
    postID: string;
    comment: string;
    createdAt: Date;
};

export type GetSingleCommentResponseDTO = {
    status: 'ok',
    comment: MappedComment,
};

export type GetCommentsResponseDTO = {
    status: 'ok',
    comments: MappedComment[],
};