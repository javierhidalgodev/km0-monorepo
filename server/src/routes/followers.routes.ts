import { handleDeleteFollower } from '@/controllers/followers.controller';
import { authenticateToken } from '@/middlewares/authenticate-token';
import { validate } from '@/middlewares/validate';
import { paramsUsernameSchema } from '@/schemas/followers.schema';
import { Router } from 'express';

const followersRoutes = Router();

followersRoutes.delete(
    '/followers/:username',
    authenticateToken(),
    validate(paramsUsernameSchema, 'params'),
    handleDeleteFollower,
);

export default followersRoutes;