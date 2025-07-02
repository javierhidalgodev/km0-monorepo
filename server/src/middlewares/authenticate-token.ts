import { RequestHandler } from 'express';
import { AppError } from '@/utils/app-error';
import { verifyToken } from '@/utils/auth';

export const authenticateToken =
(): RequestHandler => {
    return (req, _res, next) => {
        const token = req.headers.authorization;
        
        if(!token) {
            throw new AppError(401, 'No hay token');
        };

        try {
            const verifiedToken = verifyToken(token);

            req.user = verifiedToken;
            next();
        } catch (error) {
            next(error)
        };
    };
};