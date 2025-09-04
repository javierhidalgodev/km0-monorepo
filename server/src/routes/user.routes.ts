import { Router } from 'express';
import { handleGetProfile, handleGetUsersFollowers, handleGetUsersFollowing, handlePatchProfile, handleUserCreation, handleUserLogin } from '@/controllers/user.controller';
import { validate, validateBody } from '@/middlewares/validate';
import { createUserSchema, loginSchema, patchProfileSchema } from '@/schemas/user.schema';
import { authenticateToken } from '@/middlewares/authenticate-token';
import { parseToken } from '@/middlewares/parse-token';
import { paramsUsernameSchema } from '@/schemas/followers.schema';

const userRoutes = Router();

userRoutes.post(
    '/users',
    validate(createUserSchema, 'body'),
    handleUserCreation,
);

userRoutes.post(
    '/login',
    validate(loginSchema, 'body'),
    handleUserLogin,
);

userRoutes.get(
    '/:username',
    parseToken(),
    handleGetProfile,
);

userRoutes.get(
    '/:username/followers',
    authenticateToken(),
    validate(paramsUsernameSchema, 'params'),
    handleGetUsersFollowers,
);

userRoutes.get(
    '/:username/following',
    authenticateToken(),
    validate(paramsUsernameSchema, 'params'),
    handleGetUsersFollowing,
);

userRoutes.patch(
    '/profile',
    authenticateToken(),
    validateBody(patchProfileSchema),
    handlePatchProfile,
)

export default userRoutes;