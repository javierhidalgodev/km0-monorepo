import { RequestHandler } from 'express';
import { extractUserFromAuthHeader } from '@/utils/auth';

export const authenticateToken =
    (): RequestHandler => {
        return (req, _res, next) => {
            const token = req.headers.authorization;

            try {
                req.user = extractUserFromAuthHeader(token, true);

                next();
            } catch (error) {
                next(error);
            };
        };
    };