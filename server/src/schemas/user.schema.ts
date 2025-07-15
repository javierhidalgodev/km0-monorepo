import { z } from 'zod';

export const createUserSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    email: z.string().email(),
    birthdate: z.string().refine(dateStr => {
        const age = new Date().getFullYear() - new Date(dateStr).getFullYear();
        return age > 18;
    }, { message: 'Debe ser mayor de edad' }),
    isPublic: z.boolean().optional(),
}).strict();

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});