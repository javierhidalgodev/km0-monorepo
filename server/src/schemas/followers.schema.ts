import { z } from 'zod';
import { usernameSchema } from './user.schema';

export const paramsUsernameSchema = z.object({
    username: usernameSchema,
});

export const queryFollowersPaginationSchema = z.object({
    limit: z.coerce.number().max(50, 'No se pueden recuperar más de 50 registros a la vez').optional(),
    cursor: z.string()
        .regex(/^[a-zA-Z0-9]+$/, 'Wrong cursor')
        .optional(),
}).strict();