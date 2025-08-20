import { DeleteFollowerResponseDTO } from "@/dtos/delete-follower.dto";
import { deleteFollower } from "@/services/followers.service";
import { AppError } from "@/utils/app-error";
import { NextFunction, Request, Response } from "express"

export const handleDeleteFollower = async (
    req: Request,
    res: Response<DeleteFollowerResponseDTO>,
    next: NextFunction,
) => {
    const user = req.user;

    if (!user) {
        throw new AppError(404, 'User not found');
    };

    const username = req.params.username;

    try {
        const response = await deleteFollower(user.id, username);

        res.status(200).json(response);
    } catch (error) {
        next(error);
    };
};