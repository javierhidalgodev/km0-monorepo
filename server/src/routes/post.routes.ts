import { Router } from 'express';
import { handleDeletePost, handleGetPostDetail, handleGetPosts, handleGetPostsMine, handlePostCreation } from '@/controllers/post.controller';
import { authenticateToken } from '@/middlewares/authenticate-token';
import { validate, validateObjectID } from '@/middlewares/validate';
import { createPostSchema, postQuerySchema } from '@/schemas/post.schema';
import { checkOwnership } from '@/middlewares/check-ownership';
import { parseToken } from '@/middlewares/parse-token';

const postRoutes = Router();

postRoutes.post(
    '/posts',
    authenticateToken(),
    validate(createPostSchema, 'body'),
    handlePostCreation
);

postRoutes.get(
    '/posts',
    parseToken(),
    validate(postQuerySchema, 'query'),
    handleGetPosts,
);

postRoutes.get(
    '/posts/mine',
    authenticateToken(),
    validate(postQuerySchema, 'query'),
    handleGetPostsMine,
);

postRoutes.get(
    '/posts/:postID',
    parseToken(),
    validateObjectID('postID'),
    handleGetPostDetail,
);

postRoutes.delete(
    '/posts/:postID',
    authenticateToken(),
    validateObjectID('postID'),
    checkOwnership('postID'),
    handleDeletePost,
);

export default postRoutes;