import { RequestHandler } from 'express';
import { extractUserFromAuthHeader } from '@/utils/auth';

export const parseToken = (): RequestHandler => {
    return (req, _res, next) => {
        const token = req.headers.authorization;

        try {
            req.user = extractUserFromAuthHeader(token, false);
        } catch (error) {
            return next(error);
        };

        next();
    };
};