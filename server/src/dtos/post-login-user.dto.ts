import { z } from 'zod';
import { loginSchema } from '@/schemas/user.schema';

export type LoginRequestDTO = z.infer<typeof loginSchema>;

export interface LoginResponseDTO {
    status: 'logged';
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
};