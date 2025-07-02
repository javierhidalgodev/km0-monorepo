import { CommentModel } from "@/models/comment.model";
import { PostModel } from "@/models/post.model";
import { AppError } from "@/utils/app-error";
import { RequestHandler } from "express";

export type ParamIDKey = 'postID' | 'commentID'

export const checkOwnership = (paramIDKey: ParamIDKey): RequestHandler => {
    return async (req, _res, next) => {
        
        if (paramIDKey === 'postID') {
            const post = await PostModel.findById(req.params.postID);
            
            if (!post) {
                throw new AppError(404, 'Post not found');
            }
            
            if (post.user.toString() !== req.user!.id) {
                throw new AppError(403, 'Unauthorized');
            }
            
            req.post = post;
        }
        
        if (paramIDKey === 'commentID') {
            const comment = await CommentModel.findById(req.params.commentID);

            if (!comment) {
                throw new AppError(404, 'Comment not found');
            }

            if (comment.user.toString() !== req.user!.id) {
                throw new AppError(403, 'Unauthorized');
            }

            req.comment = comment;
        }

        next()
    }
}