import { IUser } from "@/models/user.model";
import { AppError } from "./app-error";
import { Request } from "express";

export const ensureAuthExists = (req: Request) => {
    if (!req.user) {
        throw new AppError(404, 'User not found');
    };

    return req.user;
};