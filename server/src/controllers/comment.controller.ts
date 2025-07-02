import { NextFunction, Request, Response } from 'express';
import { AppError } from '@/utils/app-error';
import { createComment, deletePostComment, getCommentById, getPostComments } from '@/services/comment.service';
import { CreateCommentResponseDTO } from '@/dtos/create-comment.dto';
import { GetCommentResponseDTO, GetCommentsResponseDTO } from '@/dtos/get-comments.dto';
import { DeleteCommentResponseDTO } from '@/dtos/delete-comment.dto';

export const handleCommentCreation = async (
    req: Request,
    res: Response<CreateCommentResponseDTO>,
    next: NextFunction,
) => {
    const token = req.user;

    // Defensivo
    if (!token) {
        return next(new AppError(401, 'Invalid token'));
    };

    const postID = req.params.postID;

    try {
        const response = await createComment(token.id, postID, req.body);

        res.status(201).json(response);
    } catch (error) {
        next(error);
    };
};

export const handleGetComment = async (
    req: Request,
    res: Response<GetCommentResponseDTO>,
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
    const tokenPayload = req.user;
    const comment = req.comment;

    if (!tokenPayload) {
        return next(new AppError(401, 'Invalid token'));
    };

    if (!comment) {
        throw new AppError(404, 'Comment not found');
    };

    try {
        const response = await deletePostComment(comment);

        res.status(200).json(response);
    } catch (error) {
        next(error);
    };
};