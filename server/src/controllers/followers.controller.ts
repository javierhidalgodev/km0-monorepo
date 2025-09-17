import { DeleteFollowerResponseDTO } from '@/dtos/followers.dto';
import { deleteFollower } from '@/services/followers.service';
import { AppError } from '@/utils/app-error';
import { ensureAuthExists } from '@/utils/validation.utils';
import { NextFunction, Request, Response } from 'express';

export const handleDeleteFollower = async (
    req: Request,
    res: Response<DeleteFollowerResponseDTO>,
    next: NextFunction,
) => {
    const user = ensureAuthExists(req);

    const username = req.params.username;

    try {
        const response = await deleteFollower(user.id, username);

        res.status(200).json(response);
    } catch (error) {
        next(error);
    };
};