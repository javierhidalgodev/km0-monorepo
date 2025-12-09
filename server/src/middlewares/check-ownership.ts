import { RequestHandler } from 'express';
import { CommentModel } from '@/models/comment.model';
import { AppError } from '@/utils/app-error';
import { AUTH_ERRORS, COMMENT_ERRORS } from '@/constants/messages';
import { findPostByID } from '@/utils/post.utils';

export type ParamIDKey = 'postID' | 'commentID'

export const checkOwnership = (paramIDKey: ParamIDKey): RequestHandler => {
    return async (req, _res, next) => {

        if (paramIDKey === 'postID') {
            const post = await findPostByID(req.params.postID);

            if (post.user.toString() !== req.user!.id) {
                throw new AppError(403, AUTH_ERRORS.UNAUTHORIZED_403);
            }

            req.post = post;
        }

        if (paramIDKey === 'commentID') {
            const comment = await CommentModel.findById(req.params.commentID);

            if (!comment) {
                throw new AppError(404, COMMENT_ERRORS.NOT_FOUND);
            }

            if (comment.user.toString() !== req.user!.id) {
                throw new AppError(403, AUTH_ERRORS.UNAUTHORIZED_403);
            }

            req.comment = comment;
        }

        next()
    }
}