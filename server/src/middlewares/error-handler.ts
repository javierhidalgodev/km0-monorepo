import { ErrorRequestHandler } from 'express';
import { AppError } from '@/utils/app-error';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if(err instanceof AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            details: err.details || null,
        });

        return;
    };

    // TODO: afinar el control de errores para MongoDB
    // console.log(typeof err);

    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
    });
};