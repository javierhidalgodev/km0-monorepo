import { Router } from 'express';
import { handleCommentCreation, handleDeleteComment, handleGetComment, handleGetComments } from '@/controllers/comment.controller';
import { authenticateToken } from '@/middlewares/authenticate-token';
import { validateBody, validateObjectID } from '@/middlewares/validate';
import { createCommentSchema } from '@/schemas/comment.schema';
import { checkOwnership } from '@/middlewares/check-ownership';

const commentRoutes = Router();

commentRoutes.get(
    '/posts/:postID/comments',
    authenticateToken(),
    validateObjectID('postID'),
    handleGetComments,
);

commentRoutes.post(
    '/posts/:postID/comments',
    authenticateToken(),
    validateObjectID('postID'),
    validateBody(createCommentSchema),
    handleCommentCreation,

);

commentRoutes.get(
    '/comments/:commentID',
    authenticateToken(),
    // validateBody(createCommentSchema),
    handleGetComment,
);

commentRoutes.delete(
    '/comments/:commentID',
    authenticateToken(),
    validateObjectID('commentID'),
    checkOwnership('commentID'),
    handleDeleteComment,
);

export default commentRoutes;