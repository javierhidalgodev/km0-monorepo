import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '@/utils/app-error';
import mongoose from 'mongoose';

export type ValidateSource = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, source: ValidateSource): RequestHandler => {
    return (req, _res, next) => {
        const result = schema.safeParse(req[source]);            

        if (!result.success) {
            return next(
                new AppError(400, 'Error de validación', result.error.format())
            );
        };

        if (source === 'body') req[source] = result.data;
        next();
    };
};

export const validateBody = (schema: ZodSchema): RequestHandler => {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return next(
                new AppError(400, 'Error de validación', result.error.format())
            );
        };

        req.body = result.data;
        next();
    };
};

export const validateQuery = (schema: ZodSchema): RequestHandler => {
    return (req, _res, next) => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            return next(
                new AppError(400, 'Error de validación', result.error.format())
            );
        };

        next();
    };
};

export const validateObjectID = (paramName: string): RequestHandler => {
    return (req, _res, next) => {
        const objectID = req.params[paramName];

        if (!mongoose.Types.ObjectId.isValid(objectID)) {
            return next(
                new AppError(400, 'Invalid ObjectID')
            );
        };

        next();
    };
};