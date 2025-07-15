import { z } from 'zod';

export const createPostSchema = z.object({
    activity: z.enum(['run', 'walk', 'other']),
    text: z.string().max(300, 'El campo no puede exceder de 300 caracteres').optional(),
    mood: z.enum(['excellent', 'good', 'regular', 'bad']),
    isPublic: z.boolean().optional(),
}).strict();

export const postQuerySchema = z.object({
    activity: z.enum(['run', 'walk', 'other']).optional(),
    mood: z.enum(['excellent', 'good', 'regular', 'bad']).optional(),
    isPublic: z.boolean().optional(),
}).strict();

export type IPostsQueryParams = z.infer<typeof postQuerySchema>;