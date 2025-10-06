import { NextFunction, Request, Response } from 'express';
import { AppError } from '@/utils/app-error';
import { createComment, deletePostComment, getCommentById, getPostComments } from '@/services/comment.service';
import { CreateCommentResponseDTO, GetCommentsResponseDTO, DeleteCommentResponseDTO, GetSingleCommentResponseDTO } from '@/dtos/comments.dto';
import { ensureAuthExists } from '@/utils/validation.utils';
import { COMMENT_ERRORS } from '@/constants/messages';

export const handleCommentCreation = async (
    req: Request,
    res: Response<CreateCommentResponseDTO>,
    next: NextFunction,
) => {
    const user = ensureAuthExists(req);

    const postID = req.params.postID;

    try {
        const response = await createComment(user.id, postID, req.body);

        res.status(201).json(response);
    } catch (error) {
        next(error);
    };
};

export const handleGetComment = async (
    req: Request,
    res: Response<GetSingleCommentResponseDTO>,
    next: NextFunction,
) => {
    const commentID = req.params.commentID;

    try {
        const response = await getCommentById(commentID);

        res.status(201).json(response);
    } catch (error) {
        next(error);
    };
};

export const handleGetComments = async (
    req: Request,
    res: Response<GetCommentsResponseDTO>,
    next: NextFunction,
) => {
    const postID = req.params.postID;

    try {
        const response = await getPostComments(postID);

        res.status(200).json(response);
    } catch (error) {
        next(error);
    };
};

export const handleDeleteComment = async (
    req: Request,
    res: Response<DeleteCommentResponseDTO>,
    next: NextFunction,
) => {
    ensureAuthExists(req);
    const comment = req.comment;

    if (!comment) {
        throw new AppError(404, COMMENT_ERRORS.NOT_FOUND);
    };

    try {
        const response = await deletePostComment(comment);

        res.status(200).json(response);
    } catch (error) {
        next(error);
    };
};