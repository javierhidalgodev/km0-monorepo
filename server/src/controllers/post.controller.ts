import { NextFunction, Request, Response } from 'express';
import { createPost, deletePost, getAllPosts, getPostDetail, getPostsMine } from '@/services/post.service';
import { AppError } from '@/utils/app-error';
import { CreatePostResponseDTO, GetPostsResponseDTO, GetPostDetailResponseDTO, DeletePostResponseDTO } from '@/dtos/posts.dto';

export const handlePostCreation = async (
    req: Request,
    res: Response<CreatePostResponseDTO>,
    next: NextFunction,
) => {
    const token = req.user;

    if (!token) {
        return next(new AppError(401, 'No hay token o está caducado'));
    };

    try {
        const response = await createPost(token.id, req.body);

        res.status(201).json(response);
    } catch (error) {
        next(error);
    };
};

// v.1 - public and get all + filters
export const handleGetPosts = async (
    req: Request,
    res: Response<GetPostsResponseDTO>,
    next: NextFunction,
) => {
    try {
        const response = await getAllPosts(req.query, req.user ? req.user.id : undefined);

        res.status(200).json(response);
    } catch (error) {
        next(error);
    };
};

export const handleGetPostsMine = async (
    req: Request,
    res: Response<GetPostsResponseDTO>,
    next: NextFunction,
) => {
    try {
        // TODO: Revisar req.user!.id
        const response = await getPostsMine(req.user!.id, req.query);

        res.status(200).json(response);
    } catch (error) {
        next(error);
    };
};

export const handleGetPostDetail = async (
    req: Request,
    res: Response<GetPostDetailResponseDTO>,
    next: NextFunction,
) => {
    const postID = req.params.postID;

    try {
        const response = await getPostDetail(postID, req.user ? req.user.id : undefined);

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

export const handleDeletePost = async (
    req: Request,
    res: Response<DeletePostResponseDTO>,
    next: NextFunction,
) => {
    const post = req.post;
    const tokenPayload = req.user;

    if (!tokenPayload) {
        return next(new AppError(401, 'Invalid token'));
    };

    if (!post) {
        throw new AppError(404, 'Post not found');
    }

    try {
        const response = await deletePost(post);

        res.status(200).json(response)
    } catch (error) {
        next(error);
    }
}