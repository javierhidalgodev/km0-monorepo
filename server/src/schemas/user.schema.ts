import { z } from 'zod';

export const createUserSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    email: z.string().email(),
    birthdate: z.string().refine(dateStr => {
        const age = new Date().getFullYear() - new Date(dateStr).getFullYear();
        return age > 18;
    }, { message: 'Debe ser mayor de edad' }),
    bio: z.string().max(400, { message: 'La bio no puede superar los 400 caracteres' }).optional(),
    isPublic: z.boolean().optional(),
    followers: z.array(z.string()).optional(),
    followRequests: z.array(z.string()).optional(),
    following: z.array(z.string()).optional(),
}).strict();

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// export const patchProfileSchema = z.object({
//     birthdate: z.string().refine(dateStr => {
//         const age = new Date().getFullYear() - new Date(dateStr).getFullYear();
//         return age > 18;
//     }, { message: 'Debe ser mayor de edad' }),
//     bio: z.string().max(400, { message: 'La bio no puede superar los 400 caracteres' }).optional(),
//     isPublic: z.boolean().optional(),
// })

export const patchProfileSchema = createUserSchema.omit({
    username: true,
    password: true,
    email: true,
}).partial();