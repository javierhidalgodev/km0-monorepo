import { z } from 'zod';
import { createUserSchema } from '@/schemas/user.schema';

export type CreateUserRequestDTO = z.infer<typeof createUserSchema>;

export interface CreateUserResponseDTO {
    status: 'created';
    user: {
        username: string;
        email: string;
        birthdate: string;
    };
};