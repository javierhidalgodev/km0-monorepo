import { NextFunction, Request, Response } from 'express';
import { createUser, getProfile, loginUser, patchProfile } from '@/services/user.service';
import { LoginRequestDTO, LoginResponseDTO } from '@/dtos/post-login-user.dto';
import { CreateUserRequestDTO, CreateUserResponseDTO } from '@/dtos/create-user.dto';
import { AppError } from '@/utils/app-error';
import { ProfileResponseDTO } from '@/dtos/get-profile.dto';
import { PatchProfileRequestDTO, PatchProfileResponseDTO } from '@/dtos/patch-profile.dto';

export const handleUserCreation = async (
    req: Request,
    res: Response<CreateUserResponseDTO>,
    next: NextFunction) => {
    try {
        const { username, email, password, birthdate, bio, isPublic }: CreateUserRequestDTO = req.body;

        const response = await createUser({ username, password, email, birthdate, bio, isPublic });

        res.status(201).json(response);
    } catch (error) {
        return next(error);
    };
};

export const handleUserLogin = async (
    req: Request,
    res: Response<LoginResponseDTO>,
    next: NextFunction) => {
    try {
        const { email, password }: LoginRequestDTO = req.body;
        const response = await loginUser({ email, password });

        res.status(201).json(response);
    } catch (error) {
        return next(error);
    };
};

export const handleGetProfile = async (
    req: Request,
    res: Response<ProfileResponseDTO>,
    next: NextFunction,
) => {
    const token = req.user;
    const username = req.params.username;

    if (!username) {
        throw new AppError(400, 'Bad request');
    }

    try {
        const response = await getProfile(username, token ? token.id : undefined);

        res.status(200).json(response);
    } catch (error) {
        next(error);
    };
};

export const handlePatchProfile = async (
    req: Request,
    res: Response<PatchProfileResponseDTO>,
    next: NextFunction
) => {
    try {
        const { bio, birthdate, isPublic }: PatchProfileRequestDTO = req.body;

        const response = await patchProfile(req.user!.id, { bio, birthdate, isPublic });

        res.status(200).json(response);
    } catch (error) {
        return next(error);
    };
};