import { z } from 'zod';
import { usernameSchema } from './user.schema';

export const paramsUsernameSchema = z.object({
    username: usernameSchema,
});