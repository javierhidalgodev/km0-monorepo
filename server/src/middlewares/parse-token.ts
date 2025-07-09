import { RequestHandler } from 'express';
import { verifyToken } from '@/utils/auth';

export const parseToken = (): RequestHandler => {
    return (req, _res, next) => {
        const token = req.headers.authorization;

        if (token) {
            try {
                const verifiedToken = verifyToken(token);

                req.user = verifiedToken;
            } catch (error) {
                return next(error);
            };
        };
        
        next();
    };
};