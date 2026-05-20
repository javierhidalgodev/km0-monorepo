import { Router } from 'express';
import { handleGetProfile, handleGetUsersFollowers, handleGetUsersFollowing, handlePatchProfile, handleUserCreation, handleUserLogin } from '@/controllers/user.controller';
import { validate, validateBody, validateParams, validateQuery } from '@/middlewares/validate';
import { createUserSchema, loginSchema, patchProfileSchema } from '@/schemas/user.schema';
import { authenticateToken } from '@/middlewares/authenticate-token';
import { parseToken } from '@/middlewares/parse-token';
import { paramsUsernameSchema, queryFollowersPaginationSchema } from '@/schemas/followers.schema';

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
    validateParams(paramsUsernameSchema),
    validateQuery(queryFollowersPaginationSchema),
    handleGetUsersFollowers,
);

userRoutes.get(
    '/:username/following',
    authenticateToken(),
    validateParams(paramsUsernameSchema),
    validateQuery(queryFollowersPaginationSchema),
    handleGetUsersFollowing,
);

userRoutes.patch(
    '/profile',
    authenticateToken(),
    validateBody(patchProfileSchema),
    handlePatchProfile,
)

export default userRoutes;