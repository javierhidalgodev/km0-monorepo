import { USER_ERRORS } from "@/constants/messages";
import { AppError } from "./app-error";
import { Request } from "express";

export const ensureAuthExists = (req: Request) => {
    if (!req.user) {
        throw new AppError(404, USER_ERRORS.NOT_FOUND);
    };

    return req.user;
};