import { NextFunction, Request, Response } from 'express';
import { createUser, getProfile, loginUser } from '@/services/user.service';
import { LoginRequestDTO, LoginResponseDTO } from '@/dtos/login-user.dto';
import { CreateUserRequestDTO, CreateUserResponseDTO } from '@/dtos/create-user.dto';
import { AppError } from '@/utils/app-error';
import { ProfileResponseDTO } from '@/dtos/profile.dto';

export const handleUserCreation = async (
    req: Request,
    res: Response<CreateUserResponseDTO>,
    next: NextFunction) => {
    try {
        const { username, email, password, birthdate }: CreateUserRequestDTO = req.body;

        const response = await createUser({ username, password, email, birthdate });

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

    // Defensivo
    if (!token) {
        throw new AppError(401, 'No hay token o está caducado');
    };

    try {
        const response = await getProfile(token.id);

        res.status(200).json(response);
    } catch (error) {
        next(error);
    };
};