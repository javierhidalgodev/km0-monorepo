import { Router } from 'express';
import { handleGetProfile, handleUserCreation, handleUserLogin } from '@/controllers/user.controller';
import { validate } from '@/middlewares/validate';
import { createUserSchema, loginSchema } from '@/schemas/user.schema';
import { authenticateToken } from '@/middlewares/authenticate-token';

const userRoutes = Router();

userRoutes.post(
    '/users',
    validate(createUserSchema, 'body'),
    handleUserCreation
);

userRoutes.post(
    '/login',
    validate(loginSchema, 'body'),
    handleUserLogin
);

userRoutes.get(
    '/profile',
    authenticateToken(),
    handleGetProfile
);

export default userRoutes;