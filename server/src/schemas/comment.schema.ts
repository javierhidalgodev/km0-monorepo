import { z } from 'zod';

export const createCommentSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, 'El comentario no puede estar vacío')
        .max(300, 'El comentario no puede contener más de 300 caracteres'),
}).strict();